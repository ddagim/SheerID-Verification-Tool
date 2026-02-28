/**
 * Local Document Generator
 * Generates student cards, payslips, and teacher cards as PNG images
 * Uses node-canvas for proper PNG output
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Helper to generate a random barcode-like string
function generateBarcode() {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

// Generate a gradient-like color for variety
function getUniversityColor(universityName) {
    const colors = {
        'Massachusetts Institute of Technology': '#A31F34',
        'Harvard University': '#A51C30',
        'Stanford University': '#8C1515',
        'Yale University': '#00356B',
        'Princeton University': '#FF6600',
        'Columbia University': '#1D4F91',
        'University of California, Berkeley': '#003262',
        'Pennsylvania State University-Main Campus': '#041E42',
        'New York University': '#57068C',
        'default': '#1E3A8A'
    };
    return colors[universityName] || colors['default'];
}

/**
 * Generate a student ID card as PNG buffer
 */
async function generateStudentCard(studentInfo) {
    global.emitLog?.('📸 Generating student card locally (PNG)...');
    
    const { UNIVERSITIES } = require('./universities-data');
    const universityObj = UNIVERSITIES.find(u => u.name === studentInfo.university);
    const universityName = universityObj?.name || studentInfo.university || 'State University';
    const universityColor = getUniversityColor(universityName);
    const shortName = universityObj?.shortName || universityName.split(' ')[0];
    
    // Card dimensions (credit card ratio ~3.375:2.125 at 2x)
    const W = 700, H = 440;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    
    // Background - white card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    
    // Header bar with university color
    ctx.fillStyle = universityColor;
    ctx.fillRect(0, 0, W, 80);
    
    // University name in header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(universityName.toUpperCase(), W / 2, 35);
    
    // Sub-header
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('STUDENT IDENTIFICATION CARD', W / 2, 60);
    
    // Thin accent line under header
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 80, W, 4);
    
    // Photo placeholder (left side) - gray box with silhouette look
    const photoX = 30, photoY = 100, photoW = 130, photoH = 170;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoW, photoH);
    
    // Simple silhouette in photo area
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(photoX + photoW/2, photoY + 55, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(photoX + photoW/2, photoY + 140, 45, 35, 0, Math.PI, 0, true);
    ctx.fill();
    
    // Student info (right side)
    const infoX = 190;
    let infoY = 115;
    ctx.textAlign = 'left';
    
    // Name
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('FULL NAME', infoX, infoY);
    infoY += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(studentInfo.fullName || 'John Doe', infoX, infoY);
    
    // Student ID
    infoY += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('STUDENT ID', infoX, infoY);
    infoY += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(studentInfo.studentId || '12345678', infoX, infoY);
    
    // DOB
    infoY += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('DATE OF BIRTH', infoX, infoY);
    infoY += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText(studentInfo.dob || '2002-01-01', infoX, infoY);
    
    // Department (right column)
    const col2X = 440;
    let col2Y = 115;
    const depts = universityObj?.departments || ['Computer Science'];
    const dept = depts[Math.floor(Math.random() * depts.length)];
    
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('DEPARTMENT', col2X, col2Y);
    col2Y += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText(dept, col2X, col2Y);
    
    // Status
    col2Y += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('STATUS', col2X, col2Y);
    col2Y += 18;
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('ACTIVE', col2X, col2Y);
    
    // Green dot next to active
    ctx.beginPath();
    ctx.arc(col2X + 60, col2Y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Valid dates
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const issueDate = currentMonth >= 8 ? `${currentYear}-09-01` : `${currentYear}-01-15`;
    const expDate = currentMonth >= 8 ? `${currentYear + 1}-08-31` : `${currentYear}-08-31`;
    
    col2Y += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('VALID PERIOD', col2X, col2Y);
    col2Y += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`${issueDate} — ${expDate}`, col2X, col2Y);
    
    // Bottom section - barcode area
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 340, W, 100);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 340, W, 1);
    
    // Simulated barcode
    let barcodeX = 50;
    const barcodeY = 358;
    for (let i = 0; i < 60; i++) {
        const w = Math.random() > 0.5 ? 2 : 4;
        const h = 40 + Math.random() * 8;
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(barcodeX, barcodeY, w, h);
        barcodeX += w + 1 + Math.floor(Math.random() * 3);
        if (barcodeX > 350) break;
    }
    
    // Barcode number
    const barcodeNum = generateBarcode();
    ctx.fillStyle = '#475569';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(barcodeNum, 200, 418);
    
    // University short logo text (right side of barcode)
    ctx.fillStyle = universityColor;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(shortName.toUpperCase(), W - 40, 390);
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(universityObj?.address || '', W - 40, 415);
    
    const pngBuffer = canvas.toBuffer('image/png');
    global.emitLog?.(`✅ Student card generated (PNG: ${(pngBuffer.length / 1024).toFixed(2)}KB)`);
    return pngBuffer;
}

/**
 * Generate a payslip as PNG buffer
 */
async function generatePayslip(teacherInfo) {
    global.emitLog?.('📸 Generating payslip locally (PNG)...');
    
    const { UNIVERSITIES } = require('./universities-data');
    const universities = UNIVERSITIES.map(u => u.name);
    const selectedUniversity = teacherInfo.university || universities[Math.floor(Math.random() * universities.length)];
    const universityColor = getUniversityColor(selectedUniversity);
    
    global.emitLog?.(`🎓 Payslip for: ${selectedUniversity}`);
    
    const W = 800, H = 1050;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    
    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    
    // Header
    ctx.fillStyle = universityColor;
    ctx.fillRect(0, 0, W, 70);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(selectedUniversity.toUpperCase(), W / 2, 30);
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('EMPLOYEE PAY STATEMENT', W / 2, 55);
    
    // Line separator
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 70, W, 3);
    
    ctx.textAlign = 'left';
    let y = 100;
    
    // Pay period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    ctx.fillStyle = '#475569';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(`Pay Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`, 40, y);
    ctx.fillText(`Pay Date: ${now.toISOString().split('T')[0]}`, 500, y);
    y += 30;
    
    // Employee info box
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, y, W - 80, 90);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(41, y + 1, W - 82, 24);
    
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('EMPLOYEE INFORMATION', 55, y + 17);
    
    ctx.font = '13px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Name: ${teacherInfo.fullName || 'Jane Doe'}`, 55, y + 45);
    ctx.fillText(`Employee ID: ${teacherInfo.employeeId || 'E-1234567'}`, 55, y + 65);
    ctx.fillText('Position: Professor', 55, y + 85);
    ctx.fillText('Department: Academic Affairs', 420, y + 45);
    ctx.fillText('Employment Type: Full-Time', 420, y + 65);
    
    y += 115;
    
    // Earnings header
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('EARNINGS', 40, y);
    y += 20;
    
    // Table helper
    const col1 = 40, col2 = 350, col3 = 500, col4 = 650;
    
    function drawTableHeader(yPos) {
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(40, yPos, W - 80, 22);
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.fillText('Description', col1 + 10, yPos + 15);
        ctx.fillText('Hours', col2, yPos + 15);
        ctx.fillText('Rate', col3, yPos + 15);
        ctx.fillText('Amount', col4, yPos + 15);
        return yPos + 28;
    }
    
    y = drawTableHeader(y);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    
    const baseSalary = (4500 + Math.random() * 2000).toFixed(2);
    ctx.fillText('Regular Salary', col1 + 10, y + 5);
    ctx.fillText('80.00', col2, y + 5);
    ctx.fillText(`$${(baseSalary / 80).toFixed(2)}`, col3, y + 5);
    ctx.fillText(`$${baseSalary}`, col4, y + 5);
    y += 22;
    
    const benefitsAllowance = (200 + Math.random() * 100).toFixed(2);
    ctx.fillText('Benefits Allowance', col1 + 10, y + 5);
    ctx.fillText('-', col2, y + 5);
    ctx.fillText('-', col3, y + 5);
    ctx.fillText(`$${benefitsAllowance}`, col4, y + 5);
    y += 30;
    
    // Gross total line
    const grossPay = (parseFloat(baseSalary) + parseFloat(benefitsAllowance)).toFixed(2);
    ctx.strokeStyle = '#CBD5E1';
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke();
    y += 18;
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText('GROSS PAY', col1 + 10, y);
    ctx.fillText(`$${grossPay}`, col4, y);
    y += 40;
    
    // Deductions header
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('DEDUCTIONS', 40, y);
    y += 20;
    
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(40, y, W - 80, 22);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('Description', col1 + 10, y + 15);
    ctx.fillText('Amount', col4, y + 15);
    y += 28;
    
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    
    const federalTax = (parseFloat(grossPay) * 0.22).toFixed(2);
    ctx.fillText('Federal Income Tax', col1 + 10, y + 5);
    ctx.fillText(`$${federalTax}`, col4, y + 5);
    y += 22;
    
    const stateTax = (parseFloat(grossPay) * 0.05).toFixed(2);
    ctx.fillText('State Income Tax', col1 + 10, y + 5);
    ctx.fillText(`$${stateTax}`, col4, y + 5);
    y += 22;
    
    const socialSecurity = (parseFloat(grossPay) * 0.062).toFixed(2);
    ctx.fillText('Social Security (FICA)', col1 + 10, y + 5);
    ctx.fillText(`$${socialSecurity}`, col4, y + 5);
    y += 22;
    
    const medicare = (parseFloat(grossPay) * 0.0145).toFixed(2);
    ctx.fillText('Medicare', col1 + 10, y + 5);
    ctx.fillText(`$${medicare}`, col4, y + 5);
    y += 22;
    
    const retirement = (parseFloat(grossPay) * 0.06).toFixed(2);
    ctx.fillText('Retirement Plan (403b)', col1 + 10, y + 5);
    ctx.fillText(`$${retirement}`, col4, y + 5);
    y += 30;
    
    // Net pay
    const totalDeductions = (parseFloat(federalTax) + parseFloat(stateTax) + parseFloat(socialSecurity) + parseFloat(medicare) + parseFloat(retirement)).toFixed(2);
    const netPay = (parseFloat(grossPay) - parseFloat(totalDeductions)).toFixed(2);
    
    ctx.strokeStyle = '#CBD5E1';
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(W - 40, y); ctx.stroke();
    y += 18;
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText('TOTAL DEDUCTIONS', col1 + 10, y);
    ctx.fillText(`$${totalDeductions}`, col4, y);
    y += 30;
    
    // Net pay highlight box
    ctx.fillStyle = '#F0FDF4';
    ctx.fillRect(40, y - 5, W - 80, 30);
    ctx.strokeStyle = '#86EFAC';
    ctx.strokeRect(40, y - 5, W - 80, 30);
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('NET PAY', col1 + 10, y + 14);
    ctx.fillText(`$${netPay}`, col4, y + 14);
    y += 50;
    
    // YTD Summary
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('YEAR-TO-DATE SUMMARY', 40, y);
    y += 20;
    const monthNum = now.getMonth() + 1;
    const ytdGross = (parseFloat(grossPay) * monthNum).toFixed(2);
    const ytdDeductions = (parseFloat(totalDeductions) * monthNum).toFixed(2);
    const ytdNet = (parseFloat(netPay) * monthNum).toFixed(2);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`YTD Gross: $${ytdGross}`, 55, y);
    ctx.fillText(`YTD Deductions: $${ytdDeductions}`, 300, y);
    ctx.fillText(`YTD Net: $${ytdNet}`, 550, y);
    
    // Footer
    y = H - 50;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('This is an official pay statement. Please retain for your records.', W / 2, y);
    ctx.fillText(`Document ID: ${generateBarcode()} | Generated: ${now.toISOString().split('T')[0]}`, W / 2, y + 16);
    
    const pngBuffer = canvas.toBuffer('image/png');
    global.emitLog?.(`✅ Payslip generated (PNG: ${(pngBuffer.length / 1024).toFixed(2)}KB)`);
    return pngBuffer;
}

/**
 * Generate a teacher ID card as PNG buffer
 */
async function generateTeacherCard(teacherInfo, options = {}) {
    global.emitLog?.('📸 Generating Faculty ID Card locally (PNG)...');
    
    const { UNIVERSITIES } = require('./universities-data');
    const universities = UNIVERSITIES.map(u => u.name);
    const selectedUniversity = teacherInfo.university || universities[Math.floor(Math.random() * universities.length)];
    const universityColor = getUniversityColor(selectedUniversity);
    const universityObj = UNIVERSITIES.find(u => u.name === selectedUniversity);
    const shortName = universityObj?.shortName || selectedUniversity.split(' ')[0];
    
    global.emitLog?.(`🎓 Faculty card for: ${selectedUniversity}`);
    
    const W = 700, H = 440;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    
    // Header bar
    ctx.fillStyle = universityColor;
    ctx.fillRect(0, 0, W, 80);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(selectedUniversity.toUpperCase(), W / 2, 35);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('FACULTY IDENTIFICATION CARD', W / 2, 60);
    
    // Accent line
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 80, W, 4);
    
    // Photo placeholder
    const photoX = 30, photoY = 100, photoW = 130, photoH = 170;
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoX, photoY, photoW, photoH);
    
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(photoX + photoW/2, photoY + 55, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(photoX + photoW/2, photoY + 140, 45, 35, 0, Math.PI, 0, true);
    ctx.fill();
    
    // Faculty info
    const infoX = 190;
    let infoY = 115;
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('FULL NAME', infoX, infoY);
    infoY += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(teacherInfo.fullName || 'Jane Doe', infoX, infoY);
    
    infoY += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('EMPLOYEE ID', infoX, infoY);
    infoY += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(teacherInfo.employeeId || 'E-1234567', infoX, infoY);
    
    infoY += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('POSITION', infoX, infoY);
    infoY += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Professor', infoX, infoY);
    
    // Right column
    const col2X = 440;
    let col2Y = 115;
    
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('DEPARTMENT', col2X, col2Y);
    col2Y += 18;
    ctx.fillStyle = '#1E293B';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Academic Affairs', col2X, col2Y);
    
    col2Y += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('STATUS', col2X, col2Y);
    col2Y += 18;
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('ACTIVE FACULTY', col2X, col2Y);
    
    col2Y += 35;
    ctx.fillStyle = '#64748B';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('ACADEMIC YEAR', col2X, col2Y);
    col2Y += 18;
    const now = new Date();
    ctx.fillStyle = '#1E293B';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText(`${now.getFullYear()}-${now.getFullYear() + 1}`, col2X, col2Y);
    
    // Bottom section
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 340, W, 100);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 340, W, 1);
    
    // Barcode
    let barcodeX = 50;
    for (let i = 0; i < 60; i++) {
        const w = Math.random() > 0.5 ? 2 : 4;
        const h = 40 + Math.random() * 8;
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(barcodeX, 358, w, h);
        barcodeX += w + 1 + Math.floor(Math.random() * 3);
        if (barcodeX > 350) break;
    }
    
    ctx.fillStyle = '#475569';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(generateBarcode(), 200, 418);
    
    ctx.fillStyle = universityColor;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(shortName.toUpperCase(), W - 40, 390);
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(universityObj?.address || '', W - 40, 415);
    
    const pngBuffer = canvas.toBuffer('image/png');
    global.emitLog?.(`✅ Faculty ID Card generated (PNG: ${(pngBuffer.length / 1024).toFixed(2)}KB)`);
    return pngBuffer;
}

/**
 * Generate documents in parallel
 */
async function generateDocumentsParallel(info, docTypes = ['payslip', 'teacherCard']) {
    global.emitLog?.(`📸 Generating ${docTypes.length} documents in parallel...`);
    const startTime = Date.now();

    const promises = docTypes.map(type => {
        switch (type) {
            case 'studentCard': return generateStudentCard(info);
            case 'payslip': return generatePayslip(info);
            case 'teacherCard': return generateTeacherCard(info);
            default: return Promise.resolve(null);
        }
    });

    const results = await Promise.all(promises);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    global.emitLog?.(`✅ All documents generated in ${elapsed}s`);

    return results;
}

// No browser needed for local generation
async function closeBrowser() {
    // No-op for local generator
}

module.exports = {
    generateStudentCard,
    generatePayslip,
    generateTeacherCard,
    generateDocumentsParallel,
    closeBrowser
};
