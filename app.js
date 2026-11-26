const express = require('express');

const app = express();
const teachers = new Map();
let nextId = 1;

app.use(express.json());

function validateTeacher(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return 'Request body must be a JSON object';
    }

    const { name, department, experience, email } = body;

    if (typeof name !== 'string' || !name.trim()) {
        return 'name is required and must be a non-empty string';
    }
    if (typeof department !== 'string' || !department.trim()) {
        return 'department is required and must be a non-empty string';
    }
    if (typeof experience !== 'number' || !Number.isFinite(experience) || experience < 0) {
        return 'experience is required and must be a non-negative number';
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'email is required and must be a valid email address';
    }

    return null;
}

function teacherFromBody(body) {
    return {
        name: body.name.trim(),
        department: body.department.trim(),
        experience: body.experience,
        email: body.email.trim()
    };
}

app.post('/teachers', (req, res) => {
    const validationError = validateTeacher(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const teacher = { id: String(nextId++), ...teacherFromBody(req.body) };
    teachers.set(teacher.id, teacher);
    return res.status(201).json({ message: 'Teacher created successfully', teacher });
});

app.get('/teachers', (req, res) => {
    return res.json({
        message: 'Teachers fetched successfully',
        teachers: Array.from(teachers.values())
    });
});

app.get('/teachers/:id', (req, res) => {
    const teacher = teachers.get(req.params.id);
    if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
    }

    return res.json({ message: 'Teacher fetched successfully', teacher });
});

app.put('/teachers/:id', (req, res) => {
    const teacher = teachers.get(req.params.id);
    if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
    }

    const validationError = validateTeacher(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const updatedTeacher = { id: teacher.id, ...teacherFromBody(req.body) };
    teachers.set(teacher.id, updatedTeacher);
    return res.json({ message: 'Teacher updated successfully', teacher: updatedTeacher });
});

app.delete('/teachers/:id', (req, res) => {
    if (!teachers.has(req.params.id)) {
        return res.status(404).json({ error: 'Teacher not found' });
    }

    teachers.delete(req.params.id);
    return res.json({ message: 'Teacher deleted successfully' });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500
        ? err.status
        : 500;
    const message = status === 400
        ? 'Invalid JSON in request body'
        : status === 413
            ? 'Request body is too large'
            : 'Internal server error';

    return res.status(status).json({ error: message });
});

if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Teacher API listening on http://localhost:${port}`);
    });
}

module.exports = app;