const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Resend } = require('resend');
require('dotenv').config();
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Resend initialization + Webhook configuration
const resend = new Resend(process.env.RESEND_API_KEY || '');
const WEBHOOK_REGISTRATION = process.env.WEBHOOK_REGISTRATION || 'https://n8n.onav.com.br/webhook/55ed662e-b91d-4578-b912-f7901ba71623';
const WEBHOOK_ADMIN_LIST = process.env.WEBHOOK_ADMIN_LIST || 'https://n8n.onav.com.br/webhook/124ab9ea-a4d0-45c3-bc53-4c31de2187af';
const BASE_PUBLIC_URL = process.env.BASE_PUBLIC_URL || 'http://localhost:3000';

// NocoDB config
const NOCODB_API_URL = process.env.NOCODB_API_URL || 'https://nocodb.onav.com.br';
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID || 'mut6ix6ios3kpvf';
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN || '';

// Optional n8n webhooks (if you prefer using n8n for updates instead of direct NocoDB)
const WEBHOOK_UPDATE_RECORD = process.env.WEBHOOK_UPDATE_RECORD || '';

// Axios instance for NocoDB
const noco = axios.create({
    baseURL: `${NOCODB_API_URL}/api/v2`,
    headers: NOCODB_API_TOKEN ? { 'xc-token': NOCODB_API_TOKEN } : {},
});

async function nocoListRecords() {
    const { data } = await noco.get(`/tables/${NOCODB_TABLE_ID}/records`, {
        params: { limit: 1000, offset: 0 },
    });
    // NocoDB returns { list: [...], pageInfo: {...} } or array depending on config
    return Array.isArray(data) ? data : (data.list || []);
}

async function nocoGetRecord(id) {
    const { data } = await noco.get(`/tables/${NOCODB_TABLE_ID}/records/${id}`);
    return data;
}

async function nocoUpdateRecord(id, payload) {
    // Use production webhook URL for updating QR info
    const webhookUrl = 'https://n8n.onav.com.br/webhook/1a527646-c06c-46b6-a7a0-1331072257ee';
    
    try {
        console.log('Calling QR update webhook with:', { Id: id, ...payload });
        const response = await axios.patch(webhookUrl, { Id: id, ...payload });
        console.log('QR update webhook response:', response.data);
        return { ok: true, via: 'webhook', data: response.data };
    } catch (hookErr) {
        // Log error but don't throw - QR generation should continue
        const detail = hookErr?.response?.data || hookErr.message;
        console.warn(`Update webhook failed: ${JSON.stringify(detail)}`);
        return { ok: false, via: 'webhook_failed', error: detail };
    }
    try {
        const { data } = await noco.patch(`/tables/${NOCODB_TABLE_ID}/records/${id}`, payload);
        return data;
    } catch (err) {
        const msg = err?.response?.data || err.message;
        // Fallback 0: POST with method override (PATCH)
        try {
            const { data } = await noco.post(`/tables/${NOCODB_TABLE_ID}/records/${id}`, payload, {
                headers: { 'X-HTTP-Method-Override': 'PATCH' }
            });
            return data;
        } catch (err0) {
            // continue to other fallbacks
        }
        // Fallback 1: some setups expect PUT for updates
        try {
            const { data } = await noco.put(`/tables/${NOCODB_TABLE_ID}/records/${id}`, payload);
            return data;
        } catch (err2) {
            // Fallback 1b: POST with method override (PUT)
            try {
                const { data } = await noco.post(`/tables/${NOCODB_TABLE_ID}/records/${id}`, payload, {
                    headers: { 'X-HTTP-Method-Override': 'PUT' }
                });
                return data;
            } catch (err2b) {}
            // Fallback 2: update via where filter (use NocoDB rowId alias 'Id')
            try {
                const { data } = await noco.patch(`/tables/${NOCODB_TABLE_ID}/records`, payload, {
                    params: { where: `(Id,eq,${id})` },
                });
                return data;
            } catch (err3) {
                // Fallback 2b: POST override + where
                try {
                    const { data } = await noco.post(`/tables/${NOCODB_TABLE_ID}/records`, payload, {
                        params: { where: `(Id,eq,${id})` },
                        headers: { 'X-HTTP-Method-Override': 'PATCH' }
                    });
                    return data;
                } catch (err3b) {}
                // Fallback 3: find internal rowId then patch
                try {
                    const found = await noco.get(`/tables/${NOCODB_TABLE_ID}/records`, {
                        params: { where: `(Id,eq,${id})`, limit: 1 }
                    });
                    const list = Array.isArray(found.data) ? found.data : (found.data.list || []);
                    const row = list[0];
                    const rowId = row?.Id || row?.__id || row?.ncRecordId || row?.id;
                    if (!rowId) throw new Error('Row found but no internal rowId');
                    try {
                        const { data } = await noco.patch(`/tables/${NOCODB_TABLE_ID}/records/${rowId}`, payload);
                        return data;
                    } catch (ePatch) {
                        const { data } = await noco.post(`/tables/${NOCODB_TABLE_ID}/records/${rowId}`, payload, {
                            headers: { 'X-HTTP-Method-Override': 'PATCH' }
                        });
                        return data;
                    }
                } catch (err4) {
                    const last = err4?.response?.data || err4.message;
                    // Re-throw with original and last errors for context
                    throw new Error(`NocoDB update failed: ${JSON.stringify(msg)} | PUT failed: ${JSON.stringify(err2?.response?.data || err2.message)} | WHERE update failed: ${JSON.stringify(err3?.response?.data || err3.message)} | RowId lookup failed: ${JSON.stringify(last)}`);
                }
            }
        }
    }
}

// Create a new record directly in NocoDB
async function nocoCreateRecord(payload) {
    const { data } = await noco.post(`/tables/${NOCODB_TABLE_ID}/records`, payload);
    return data;
}

// Find first record by email
async function nocoFindByEmail(email) {
    const where = `(email,eq,'${email}')`;
    const { data } = await noco.get(`/tables/${NOCODB_TABLE_ID}/records`, {
        params: { where, limit: 1 }
    });
    const list = Array.isArray(data) ? data : (data.list || []);
    return list[0] || null;
}

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory
app.use('/qr', express.static('qr')); // Serve QR codes

// Ensure QR directory exists
const qrDir = path.join(__dirname, 'qr');
if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
}

// Admin list proxy (optional). Frontend can keep calling http://localhost:3000/guests
app.get('/guests', async (req, res) => {
    try {
        const { data } = await axios.get(WEBHOOK_ADMIN_LIST);
        // Expecting { success: true, guests: [...] }
        if (data && data.success && Array.isArray(data.guests)) {
            return res.json(data);
        }
        // If webhook returns raw list
        if (Array.isArray(data)) {
            return res.json({ success: true, guests: data });
        }
        return res.json({ success: true, guests: [] });
    } catch (err) {
        console.error('Error fetching admin list from n8n:', err?.response?.data || err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch guests' });
    }
});

// Generate QR Code endpoint
app.post('/generate-qr', async (req, res) => {
    console.log('Received request to /generate-qr');
    try {
        const { name, email, phone, company, position } = req.body;
        console.log('Request body:', req.body);
        
        if (!name || !email) {
            console.log('Missing name or email');
            return res.status(400).json({ error: 'Name and email are required' });
        }
        // 1) Create or fetch attendee via n8n → NocoDB
        let uniqueId;
        let existsFlag = false;
        try {
            const { data } = await axios.post(WEBHOOK_REGISTRATION, { name, email, phone, company, position });
            const idFromWebhook = (data && (data.id ?? data.Id ?? (data.data && data.data.id) ?? data.recordId)) || null;
            if (!idFromWebhook) {
                console.warn('Invalid response from registration webhook (no id). Payload was:', data);
                return res.status(502).json({
                    error: 'Registration webhook did not return Id',
                    hint: 'In n8n Respond to Webhook, enable Expression and return {"success": true, "id": {{$json.Id}}}'
                });
            } else {
                uniqueId = String(idFromWebhook);
                existsFlag = (data?.exists === 'boolean') ? data.exists : false;
                console.log('Registration webhook responded with id:', uniqueId, 'exists:', existsFlag);
            }
        } catch (err) {
            console.error('Error calling registration webhook:', err?.response?.data || err.message);
            return res.status(502).json({
                error: 'Registration webhook not reachable',
                hint: "Click 'Execute workflow' in n8n test mode or use Production URL; method must be POST"
            });
        }

        // 2) Generate QR locally (id|name) and host under /qr
        const qrData = `${uniqueId}|${name}`;
        const filename = `VP-${uniqueId}.png`;
        const filepath = path.join(qrDir, filename);
        const qrCodeUrl = `/qr/${filename}`;
        if (!fs.existsSync(filepath)) {
            await QRCode.toFile(filepath, qrData);
        }

        // 3) Update NocoDB record with QR info and mark as pending approval (no email now)
        const updateResult = await nocoUpdateRecord(uniqueId, {
            qr_code_url: `${BASE_PUBLIC_URL}${qrCodeUrl}`,
            qr_data: qrData,
            approval_status: 'pending',
            confirmation_sent: false,
        });
        
        if (!updateResult.ok) {
            console.warn('Warning: failed to update NocoDB with QR info via', updateResult.via);
        } else {
            console.log('QR info update:', updateResult.via);
        }

        // 4) Return pending status (no email is sent here)
        res.json({
            success: true,
            attendee_id: uniqueId,
            qr_code_url: qrCodeUrl,
            status: 'pending_approval',
            message: 'Registration saved. Awaiting admin approval to email QR.'
        });

    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({
            error: 'Error generating QR Code',
            details: error.message
        });
    }
});

// Save QR code from client-side generation
app.post('/save-qr', upload.single('qrImage'), (req, res) => {
    try {
        const { name, email, phone, company, position, uniqueId, qrData } = req.body;
        
        if (!name || !email || !uniqueId || !qrData || !req.file) {
            return res.status(400).json({ error: 'Dados incompletos para salvar QR Code' });
        }

        // Move uploaded file to QR directory
        const filename = `${uniqueId}.png`;
        const filepath = path.join(qrDir, filename);
        
        // Copy from uploads to qr folder
        fs.copyFileSync(req.file.path, filepath);
        // Clean up temporary file
        fs.unlinkSync(req.file.path);

        // Save attendee data
        const attendeeData = {
            id: uniqueId,
            name: name,
            email: email,
            phone: phone || '',
            company: company || '',
            position: position || '',
            timestamp: new Date().toISOString(),
            qr_file: filename,
            checked_in: false
        };

        // Load existing attendees or create new array
        const attendeesFile = path.join(qrDir, 'attendees.json');
        let attendees = [];
        
        if (fs.existsSync(attendeesFile)) {
            try {
                const data = fs.readFileSync(attendeesFile, 'utf8');
                attendees = JSON.parse(data);
            } catch (error) {
                console.error('Error reading attendees file:', error);
                attendees = [];
            }
        }

        // Check if attendee already exists (by email)
        const existingIndex = attendees.findIndex(a => a.email === email);
        if (existingIndex !== -1) {
            // Update existing attendee
            attendees[existingIndex] = attendeeData;
            console.log('Updated existing attendee:', email);
        } else {
            // Add new attendee
            attendees.push(attendeeData);
            console.log('Added new attendee:', email);
        }

        // Save updated attendees list
        fs.writeFileSync(attendeesFile, JSON.stringify(attendees, null, 2));

        res.json({
            success: true,
            filename: filename,
            attendee_id: uniqueId,
            message: 'QR Code salvo com sucesso!'
        });

    } catch (error) {
        console.error('Error saving QR code:', error);
        res.status(500).json({ 
            error: 'Erro ao salvar QR Code',
            details: error.message 
        });
    }
});

// Get attendees list
app.get('/attendees', async (req, res) => {
    try {
        // Prefer n8n admin list webhook if configured
        if (WEBHOOK_ADMIN_LIST) {
            const { data } = await axios.get(WEBHOOK_ADMIN_LIST);
            if (data && data.success && Array.isArray(data.guests)) {
                return res.json({ success: true, attendees: data.guests });
            }
            if (Array.isArray(data)) {
                return res.json({ success: true, attendees: data });
            }
        }
        // Fallback to direct NocoDB
        const list = await nocoListRecords();
        res.json({ success: true, attendees: list });
    } catch (error) {
        console.error('Error reading attendees:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Error reading attendees list' });
    }
});

// Validate QR Code endpoint
app.post('/validate-qr', async (req, res) => {
    try {
        const { qrData } = req.body;
        console.log('=== QR VALIDATION DEBUG ===');
        console.log('Received QR data:', qrData);
        
        if (!qrData) {
            console.log('ERROR: No QR data provided');
            return res.status(400).json({ error: 'QR Data is required' });
        }

        const parts = qrData.split('|');
        console.log('QR parts:', parts);
        if (parts.length !== 2) {
            console.log('ERROR: Invalid QR format, expected ID|Name');
            return res.json({ success: false, error: 'Invalid QR Code format. Expected: ID|Name' });
        }

        const [qrId, qrName] = parts;
        console.log('Extracted ID:', qrId, 'Name:', qrName);

        let attendee;
        try {
            console.log('Looking up attendee with ID:', qrId);
            attendee = await nocoGetRecord(qrId);
            console.log('Found attendee:', JSON.stringify(attendee, null, 2));
        } catch (e) {
            console.log('ERROR: Database lookup failed:', e.message);
            return res.json({ success: false, error: 'Attendee not found in database' });
        }

        if (!attendee) {
            console.log('ERROR: No attendee record returned');
            return res.json({ success: false, error: 'Attendee not found' });
        }

        // Debug name comparison
        const dbName = (attendee.name || '').trim();
        const qrNameTrimmed = qrName.trim();
        console.log('Name comparison - DB:', `"${dbName}"`, 'QR:', `"${qrNameTrimmed}"`, 'Match:', dbName === qrNameTrimmed);
        
        if (dbName !== qrNameTrimmed) {
            console.log('ERROR: Name mismatch');
            return res.json({ success: false, error: `Name mismatch. DB: "${dbName}", QR: "${qrNameTrimmed}"` });
        }

        // Check approval status (be more lenient - allow null/undefined)
        console.log('Approval status:', attendee.approval_status);
        if (attendee.approval_status === 'rejected' || attendee.approval_status === 'denied') {
            console.log('ERROR: Registration rejected, status:', attendee.approval_status);
            return res.json({ success: false, error: 'Registration has been rejected' });
        }
        // Allow null, undefined, 'approved', 'pending', or any other status except rejected

        // Map NocoDB fields to door scanner expected format
        const mappedAttendee = {
            id: attendee.Id || attendee.id,
            name: attendee.name,
            email: attendee.email,
            phone: attendee.phone,
            company: attendee.company,
            position: attendee.position,
            checked_in: attendee.checked_in === 'sim' || attendee.checked_in === true || attendee.checked_in === 'true' || false,
            checkin_time: attendee.checkin_time,
            approval_status: attendee.approval_status || 'pending'
        };

        console.log('Validation SUCCESS, returning attendee:', JSON.stringify(mappedAttendee, null, 2));
        console.log('=== END QR VALIDATION DEBUG ===');

        res.json({
            success: true,
            attendee: mappedAttendee,
            message: 'Valid QR Code!'
        });

    } catch (error) {
        console.error('Error validating QR code:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Check-in attendee endpoint
app.post('/checkin', async (req, res) => {
    try {
        const { attendeeId } = req.body;
        
        if (!attendeeId) {
            return res.status(400).json({ error: 'Attendee ID is required' });
        }

        // Use dedicated check-in webhook if configured
        const checkinWebhook = process.env.WEBHOOK_CHECKIN;
        if (checkinWebhook) {
            try {
                console.log('Calling check-in webhook for attendee:', attendeeId);
                const response = await axios.patch(checkinWebhook, {
                    Id: attendeeId,
                    checked_in: true,
                    checkin_time: new Date().toISOString()
                });
                console.log('Check-in webhook response:', response.data);
                
                return res.json({
                    success: true,
                    attendee: response.data,
                    message: 'Check-in confirmed successfully!',
                    via: 'webhook'
                });
            } catch (webhookError) {
                console.warn('Check-in webhook failed, falling back to direct update:', webhookError?.response?.data || webhookError.message);
            }
        }

        // Fallback to direct NocoDB update
        const updated = await nocoUpdateRecord(attendeeId, { checked_in: true, checkin_time: new Date().toISOString() });

        if (!updated || updated.id === undefined) {
            return res.status(404).json({ error: 'Attendee not found' });
        }

        res.json({
            success: true,
            attendee: updated,
            message: 'Check-in confirmed successfully!',
            via: 'direct'
        });

    } catch (error) {
        console.error('Error during check-in:', error?.response?.data || error.message);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Admin: Approve and send QR email
app.post('/approve-and-send', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ success: false, error: 'Missing attendee id' });

        // Fetch attendee
        const attendee = await nocoGetRecord(id);
        if (!attendee) return res.status(404).json({ success: false, error: 'Attendee not found' });

        const name = attendee.name;
        const email = attendee.email;
        if (!name || !email) return res.status(400).json({ success: false, error: 'Attendee missing name/email' });

        // Ensure QR exists
        const qrData = `${id}|${name}`;
        const filename = `VP-${id}.png`;
        const filepath = path.join(qrDir, filename);
        const qrCodeUrl = `/qr/${filename}`;
        if (!fs.existsSync(filepath)) {
            await QRCode.toFile(filepath, qrData);
        }
        const qrDataURL = await QRCode.toDataURL(qrData);

        // Build email HTML (reuse template)
        const emailHtml = `<!DOCTYPE html><html><body><div style="font-family:Arial,sans-serif;color:#fff;background:#000;padding:20px;">`+
            `<h1 style="color:#fff;">Muito Obrigado!</h1>`+
            `<p>Olá <strong>${name}</strong>, seu QR code para o evento está em anexo.</p>`+
            `<img src="cid:qrimage" alt="QR" style="max-width:200px;border-radius:12px;"/>`+
            `<p>Apresente este QR Code na entrada do evento.</p>`+
            `</div></body></html>`;

        // Send email with QR
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Confirmação de Registro - Virtual Projection Demo',
            html: emailHtml,
            attachments: [
                {
                    filename: 'qr-code.png',
                    content: qrDataURL.split(',')[1],
                    type: 'image/png',
                    disposition: 'attachment',
                    content_id: 'qrimage'
                }
            ]
        });

        // Update NocoDB as approved and email sent
        const updated = await nocoUpdateRecord(id, {
            approval_status: 'approved',
            approved: true,
            confirmation_sent: true,
            confirmation_sent_at: new Date().toISOString(),
            qr_code_url: `${BASE_PUBLIC_URL}${qrCodeUrl}`,
        });

        res.json({ success: true, message: 'Approved and email sent', attendee: updated });
    } catch (err) {
        console.error('approve-and-send error:', err?.response?.data || err.message);
        res.status(500).json({ success: false, error: 'Failed to approve and send email' });
    }
});

// Update QR webhook proxy
app.post('/update-qr', async (req, res) => {
    try {
        const { attendee_id, qr_data, qr_code_url, name, email } = req.body;
        
        if (!attendee_id || !qr_data) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Call the n8n QR webhook using PATCH method for production
        const webhookUrl = 'https://n8n.onav.com.br/webhook/1a527646-c06c-46b6-a7a0-1331072257ee';
        console.log('Calling QR update webhook from client with:', { attendee_id, qr_data, qr_code_url, name, email });
        const { data } = await axios.patch(webhookUrl, {
            Id: attendee_id,  // Use Id for NocoDB record ID
            attendee_id,
            qr_data,
            qr_code_url,
            name,
            email
        });

        console.log('QR update webhook success:', data);
        res.json({ success: true, data });
    } catch (error) {
        console.error('QR webhook proxy error:', error?.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update QR via webhook',
            details: error?.response?.data || error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'QR Code server is running!',
        port: PORT 
    });
});

// Debug endpoint to test QR validation
app.get('/debug-qr/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('=== DEBUG QR TEST ===');
        console.log('Testing QR for ID:', id);
        
        // Get the attendee record
        const attendee = await nocoGetRecord(id);
        console.log('Attendee record:', JSON.stringify(attendee, null, 2));
        
        if (!attendee) {
            return res.json({ error: 'Attendee not found' });
        }
        
        // Generate the QR data that would be created
        const qrData = `${id}|${attendee.name}`;
        console.log('Expected QR data:', qrData);
        
        // Test validation
        const validation = await new Promise((resolve) => {
            // Simulate the validation logic
            const parts = qrData.split('|');
            const [qrId, qrName] = parts;
            const dbName = (attendee.name || '').trim();
            const qrNameTrimmed = qrName.trim();
            
            resolve({
                qrFormat: qrData,
                parts: parts,
                nameMatch: dbName === qrNameTrimmed,
                dbName: dbName,
                qrName: qrNameTrimmed,
                approvalStatus: attendee.approval_status,
                checkedIn: attendee.checked_in
            });
        });
        
        res.json({
            success: true,
            attendee: attendee,
            validation: validation
        });
        
    } catch (error) {
        console.error('Debug error:', error);
        res.json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 QR Code server running on http://localhost:${PORT}`);
    console.log(`📁 QR codes will be saved in: ${qrDir}`);
    console.log(`🔗 Test health check: http://localhost:${PORT}/health`);
});

module.exports = app;