const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

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

// Generate QR Code endpoint
app.post('/generate-qr', async (req, res) => {
    try {
        const { name, email } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Nome e email são obrigatórios' });
        }

        // Generate unique ID
        const timestamp = new Date().toISOString();
        const uniqueId = 'VP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        // QR Code data - Simple format with just name and ID
        const qrData = `${uniqueId}|${name}`;

        // Generate QR code as PNG buffer
        const qrCodeBuffer = await QRCode.toBuffer(qrData, {
            type: 'png',
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Save QR code image
        const filename = `${uniqueId}.png`;
        const filepath = path.join(qrDir, filename);
        fs.writeFileSync(filepath, qrCodeBuffer);

        // Save attendee data
        const attendeeData = {
            id: uniqueId,
            name: name,
            email: email,
            timestamp: timestamp,
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
        const existingAttendee = attendees.find(a => a.email === email);
        if (existingAttendee) {
            console.log('Attendee already exists:', email);
            
            // Return existing QR code data
            const existingQrPath = path.join(qrDir, existingAttendee.qr_file);
            let qrDataURL = '';
            
            if (fs.existsSync(existingQrPath)) {
                const existingQrData = `${existingAttendee.id}|${existingAttendee.name}`;
                qrDataURL = await QRCode.toDataURL(existingQrData, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
            }

            return res.json({
                success: true,
                qr_code_url: `/qr/${existingAttendee.qr_file}`,
                qr_data_url: qrDataURL,
                attendee_id: existingAttendee.id,
                message: 'QR Code já existe para este e-mail!'
            });
        }

        // Add new attendee
        attendees.push(attendeeData);

        // Save updated attendees list
        fs.writeFileSync(attendeesFile, JSON.stringify(attendees, null, 2));

        // Generate QR code as data URL for immediate display
        const qrDataURL = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        res.json({
            success: true,
            qr_code_url: `/qr/${filename}`,
            qr_data_url: qrDataURL, // For immediate display
            attendee_id: uniqueId,
            message: 'QR Code gerado com sucesso!'
        });

    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ 
            error: 'Erro ao gerar QR Code',
            details: error.message 
        });
    }
});

// Save QR code from client-side generation
app.post('/save-qr', upload.single('qrImage'), (req, res) => {
    try {
        const { name, email, uniqueId, qrData } = req.body;
        
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
app.get('/attendees', (req, res) => {
    try {
        const attendeesFile = path.join(qrDir, 'attendees.json');
        
        if (fs.existsSync(attendeesFile)) {
            const data = fs.readFileSync(attendeesFile, 'utf8');
            const attendees = JSON.parse(data);
            res.json({ success: true, attendees: attendees });
        } else {
            res.json({ success: true, attendees: [] });
        }
    } catch (error) {
        console.error('Error reading attendees:', error);
        res.status(500).json({ error: 'Erro ao ler lista de participantes' });
    }
});

// Validate QR Code endpoint
app.post('/validate-qr', (req, res) => {
    try {
        const { qrData } = req.body;
        
        if (!qrData) {
            return res.status(400).json({ error: 'QR Data é obrigatório' });
        }

        // Parse QR data (format: "VP-timestamp-random|Name")
        const parts = qrData.split('|');
        if (parts.length !== 2) {
            return res.json({ success: false, error: 'Formato de QR Code inválido' });
        }

        const [qrId, qrName] = parts;

        // Load attendees
        const attendeesFile = path.join(qrDir, 'attendees.json');
        if (!fs.existsSync(attendeesFile)) {
            return res.json({ success: false, error: 'Lista de participantes não encontrada' });
        }

        let attendees = [];
        try {
            const data = fs.readFileSync(attendeesFile, 'utf8');
            attendees = JSON.parse(data);
        } catch (error) {
            console.error('Error reading attendees file:', error);
            return res.json({ success: false, error: 'Erro ao ler lista de participantes' });
        }

        // Find attendee by ID
        const attendee = attendees.find(a => a.id === qrId);
        if (!attendee) {
            return res.json({ success: false, error: 'Participante não encontrado' });
        }

        // Verify name matches (basic validation)
        if (attendee.name !== qrName) {
            return res.json({ success: false, error: 'Nome não confere com o cadastro' });
        }

        res.json({
            success: true,
            attendee: attendee,
            message: 'QR Code válido!'
        });

    } catch (error) {
        console.error('Error validating QR code:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// Check-in attendee endpoint
app.post('/checkin', (req, res) => {
    try {
        const { attendeeId, email } = req.body;
        
        if (!attendeeId || !email) {
            return res.status(400).json({ error: 'ID e email do participante são obrigatórios' });
        }

        // Load attendees
        const attendeesFile = path.join(qrDir, 'attendees.json');
        if (!fs.existsSync(attendeesFile)) {
            return res.status(404).json({ error: 'Lista de participantes não encontrada' });
        }

        let attendees = [];
        try {
            const data = fs.readFileSync(attendeesFile, 'utf8');
            attendees = JSON.parse(data);
        } catch (error) {
            console.error('Error reading attendees file:', error);
            return res.status(500).json({ error: 'Erro ao ler lista de participantes' });
        }

        // Find and update attendee
        const attendeeIndex = attendees.findIndex(a => a.id === attendeeId && a.email === email);
        if (attendeeIndex === -1) {
            return res.status(404).json({ error: 'Participante não encontrado' });
        }

        // Update check-in status
        attendees[attendeeIndex].checked_in = true;
        attendees[attendeeIndex].checkin_time = new Date().toISOString();

        // Save updated attendees list
        try {
            fs.writeFileSync(attendeesFile, JSON.stringify(attendees, null, 2));
            console.log(`Check-in confirmed for: ${attendees[attendeeIndex].name} (${email})`);
            
            res.json({
                success: true,
                attendee: attendees[attendeeIndex],
                message: 'Check-in confirmado com sucesso!'
            });
        } catch (error) {
            console.error('Error saving attendees file:', error);
            res.status(500).json({ error: 'Erro ao salvar check-in' });
        }

    } catch (error) {
        console.error('Error during check-in:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 QR Code server running on http://localhost:${PORT}`);
    console.log(`📁 QR codes will be saved in: ${qrDir}`);
    console.log(`🔗 Test health check: http://localhost:${PORT}/health`);
});

module.exports = app;