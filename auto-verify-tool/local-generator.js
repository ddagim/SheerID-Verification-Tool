/**
 * Local Document Generator
 * Generates student cards and payslips locally without external dependencies
 * Uses PDFKit for document generation
 */

const PDFDocument = require('pdfkit');
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
    global.emitLog?.('📸 Generating student card locally...');
    
    const { UNIVERSITIES } = require('./universities-data');
    const universityObj = UNIVERSITIES.find(u => u.name === studentInfo.university);
    const universityName = universityObj?.name || studentInfo.university || 'State University';
    const universityColor = getUniversityColor(universityName);
    
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: [350, 220], // ID card size
                margins: { top: 10, bottom: 10, left: 10, right: 10 }
            });
            
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                global.emitLog?.(`✅ Student card generated (PDF: ${(pdfBuffer.length / 1024).toFixed(2)}KB)`);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
            
            // Header bar with university color
            doc.rect(0, 0, 350, 50).fill(universityColor);
            
            // University name in header
            doc.fontSize(14)
               .fill('#FFFFFF')
               .text(universityName.toUpperCase(), 10, 15, {
                   width: 330,
                   align: 'center'
               });
            
            // "STUDENT ID" label
            doc.fontSize(8)
               .text('STUDENT IDENTIFICATION CARD', 10, 35, {
                   width: 330,
                   align: 'center'
               });
            
            // Photo placeholder (left side)
            doc.rect(15, 60, 80, 100).fill('#E5E7EB');
            doc.fontSize(8)
               .fill('#6B7280')
               .text('PHOTO', 40, 105);
            
            // Student info (right side)
            const infoX = 110;
            let infoY = 65;
            
            doc.fontSize(10).fill('#1F2937');
            
            doc.text('NAME:', infoX, infoY);
            doc.font('Helvetica-Bold').text(studentInfo.fullName || 'John Doe', infoX + 45, infoY);
            doc.font('Helvetica');
            
            infoY += 20;
            doc.text('ID:', infoX, infoY);
            doc.font('Helvetica-Bold').text(studentInfo.studentId || '12345678', infoX + 45, infoY);
            doc.font('Helvetica');
            
            infoY += 20;
            doc.text('DOB:', infoX, infoY);
            doc.text(studentInfo.dob || '2002-01-01', infoX + 45, infoY);
            
            infoY += 20;
            doc.text('STATUS:', infoX, infoY);
            doc.fill('#059669').text('ACTIVE STUDENT', infoX + 45, infoY);
            doc.fill('#1F2937');
            
            // Valid dates
            const now = new Date();
            const currentYear = now.getFullYear();
            const issueDate = `${currentYear}-09-01`;
            const expDate = `${currentYear + 1}-08-31`;
            
            infoY += 20;
            doc.fontSize(8).text(`VALID: ${issueDate} to ${expDate}`, infoX, infoY);
            
            // Barcode area at bottom
            doc.rect(15, 175, 320, 35).fill('#F3F4F6');
            
            // Simulated barcode lines
            let barcodeX = 25;
            for (let i = 0; i < 40; i++) {
                const width = Math.random() > 0.5 ? 2 : 4;
                const height = 20 + Math.random() * 5;
                doc.rect(barcodeX, 180, width, height).fill('#000000');
                barcodeX += width + 2 + Math.floor(Math.random() * 3);
                if (barcodeX > 320) break;
            }
            
            // Barcode number
            doc.fontSize(7)
               .fill('#374151')
               .text(generateBarcode(), 15, 202, { width: 320, align: 'center' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate a payslip as PNG buffer
 */
async function generatePayslip(teacherInfo) {
    global.emitLog?.('📸 Generating payslip locally...');
    
    const { UNIVERSITIES } = require('./universities-data');
    const universities = UNIVERSITIES.map(u => u.name);
    const selectedUniversity = teacherInfo.university || universities[Math.floor(Math.random() * universities.length)];
    
    global.emitLog?.(`🎓 Payslip for: ${selectedUniversity}`);
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                global.emitLog?.(`✅ Payslip generated (PDF: ${(pdfBuffer.length / 1024).toFixed(2)}KB)`);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
            
            // Header
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .text(selectedUniversity.toUpperCase(), { align: 'center' });
            
            doc.moveDown(0.5);
            doc.fontSize(14)
               .font('Helvetica')
               .text('EMPLOYEE PAY STATEMENT', { align: 'center' });
            
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#CCCCCC');
            doc.moveDown();
            
            // Pay period
            const now = new Date();
            const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            doc.fontSize(10);
            doc.text(`Pay Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`);
            doc.text(`Pay Date: ${now.toISOString().split('T')[0]}`);
            
            doc.moveDown();
            
            // Employee info box
            doc.rect(50, doc.y, 495, 80).stroke('#CCCCCC');
            const employeeY = doc.y + 10;
            
            doc.text('EMPLOYEE INFORMATION', 60, employeeY);
            doc.moveDown(0.5);
            doc.text(`Name: ${teacherInfo.fullName || 'Jane Doe'}`, 60, employeeY + 20);
            doc.text(`Employee ID: ${teacherInfo.employeeId || 'E-1234567'}`, 60, employeeY + 35);
            doc.text('Position: Professor', 60, employeeY + 50);
            doc.text('Department: Academic Affairs', 300, employeeY + 20);
            doc.text('Employment Type: Full-Time', 300, employeeY + 35);
            
            doc.y = employeeY + 90;
            
            // Earnings table
            doc.moveDown();
            doc.font('Helvetica-Bold').text('EARNINGS', 50, doc.y);
            doc.moveDown(0.3);
            
            const tableTop = doc.y;
            const col1 = 50, col2 = 250, col3 = 350, col4 = 450;
            
            // Table header
            doc.rect(50, tableTop, 495, 20).fill('#E5E7EB');
            doc.fill('#000000').font('Helvetica-Bold').fontSize(9);
            doc.text('Description', col1 + 5, tableTop + 5);
            doc.text('Hours', col2, tableTop + 5);
            doc.text('Rate', col3, tableTop + 5);
            doc.text('Amount', col4, tableTop + 5);
            
            // Table rows
            doc.font('Helvetica').fontSize(9);
            let rowY = tableTop + 25;
            
            const baseSalary = (4500 + Math.random() * 2000).toFixed(2);
            
            doc.text('Regular Salary', col1 + 5, rowY);
            doc.text('80.00', col2, rowY);
            doc.text(`$${(baseSalary / 80).toFixed(2)}`, col3, rowY);
            doc.text(`$${baseSalary}`, col4, rowY);
            
            rowY += 18;
            const benefitsAllowance = (200 + Math.random() * 100).toFixed(2);
            doc.text('Benefits Allowance', col1 + 5, rowY);
            doc.text('-', col2, rowY);
            doc.text('-', col3, rowY);
            doc.text(`$${benefitsAllowance}`, col4, rowY);
            
            // Gross total
            rowY += 25;
            const grossPay = (parseFloat(baseSalary) + parseFloat(benefitsAllowance)).toFixed(2);
            doc.moveTo(50, rowY - 5).lineTo(545, rowY - 5).stroke('#CCCCCC');
            doc.font('Helvetica-Bold');
            doc.text('GROSS PAY', col1 + 5, rowY);
            doc.text(`$${grossPay}`, col4, rowY);
            
            // Deductions
            doc.font('Helvetica-Bold').text('DEDUCTIONS', 50, rowY + 40);
            rowY += 60;
            
            doc.rect(50, rowY, 495, 20).fill('#E5E7EB');
            doc.fill('#000000');
            doc.text('Description', col1 + 5, rowY + 5);
            doc.text('Amount', col4, rowY + 5);
            
            doc.font('Helvetica').fontSize(9);
            rowY += 25;
            
            const federalTax = (parseFloat(grossPay) * 0.22).toFixed(2);
            doc.text('Federal Income Tax', col1 + 5, rowY);
            doc.text(`$${federalTax}`, col4, rowY);
            
            rowY += 18;
            const stateTax = (parseFloat(grossPay) * 0.05).toFixed(2);
            doc.text('State Income Tax', col1 + 5, rowY);
            doc.text(`$${stateTax}`, col4, rowY);
            
            rowY += 18;
            const socialSecurity = (parseFloat(grossPay) * 0.062).toFixed(2);
            doc.text('Social Security', col1 + 5, rowY);
            doc.text(`$${socialSecurity}`, col4, rowY);
            
            rowY += 18;
            const medicare = (parseFloat(grossPay) * 0.0145).toFixed(2);
            doc.text('Medicare', col1 + 5, rowY);
            doc.text(`$${medicare}`, col4, rowY);
            
            // Net pay
            rowY += 30;
            const totalDeductions = (parseFloat(federalTax) + parseFloat(stateTax) + parseFloat(socialSecurity) + parseFloat(medicare)).toFixed(2);
            const netPay = (parseFloat(grossPay) - parseFloat(totalDeductions)).toFixed(2);
            
            doc.moveTo(50, rowY - 5).lineTo(545, rowY - 5).stroke('#CCCCCC');
            doc.font('Helvetica-Bold');
            doc.text('TOTAL DEDUCTIONS', col1 + 5, rowY);
            doc.text(`$${totalDeductions}`, col4, rowY);
            
            rowY += 25;
            doc.rect(50, rowY - 5, 495, 25).fill('#E5E7EB');
            doc.fill('#000000').fontSize(11);
            doc.text('NET PAY', col1 + 5, rowY);
            doc.text(`$${netPay}`, col4, rowY);
            
            // Footer
            doc.fontSize(8).font('Helvetica');
            doc.text('This is an official pay statement. Please retain for your records.', 50, 750, { align: 'center' });
            doc.text(`Document ID: ${generateBarcode()}`, { align: 'center' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate a teacher ID card
 */
async function generateTeacherCard(teacherInfo, options = {}) {
    global.emitLog?.('📸 Generating Faculty ID Card locally...');
    
    const { UNIVERSITIES } = require('./universities-data');
    const universities = UNIVERSITIES.map(u => u.name);
    const selectedUniversity = teacherInfo.university || universities[Math.floor(Math.random() * universities.length)];
    const universityColor = getUniversityColor(selectedUniversity);
    
    global.emitLog?.(`🎓 Faculty card for: ${selectedUniversity}`);
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: [350, 220],
                margins: { top: 10, bottom: 10, left: 10, right: 10 }
            });
            
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                global.emitLog?.(`✅ Faculty ID Card generated (PDF: ${(pdfBuffer.length / 1024).toFixed(2)}KB)`);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);
            
            // Header bar
            doc.rect(0, 0, 350, 50).fill(universityColor);
            
            // University name
            doc.fontSize(12)
               .fill('#FFFFFF')
               .text(selectedUniversity.toUpperCase(), 10, 12, {
                   width: 330,
                   align: 'center'
               });
            
            // "FACULTY ID" label
            doc.fontSize(10)
               .text('FACULTY IDENTIFICATION CARD', 10, 32, {
                   width: 330,
                   align: 'center'
               });
            
            // Photo placeholder
            doc.rect(15, 60, 80, 100).fill('#E5E7EB');
            doc.fontSize(8)
               .fill('#6B7280')
               .text('PHOTO', 40, 105);
            
            // Faculty info
            const infoX = 110;
            let infoY = 65;
            
            doc.fontSize(10).fill('#1F2937');
            
            doc.text('NAME:', infoX, infoY);
            doc.font('Helvetica-Bold').text(teacherInfo.fullName || 'Jane Doe', infoX + 45, infoY);
            doc.font('Helvetica');
            
            infoY += 20;
            doc.text('ID:', infoX, infoY);
            doc.font('Helvetica-Bold').text(teacherInfo.employeeId || 'E-1234567', infoX + 45, infoY);
            doc.font('Helvetica');
            
            infoY += 20;
            doc.text('TITLE:', infoX, infoY);
            doc.text('Professor', infoX + 45, infoY);
            
            infoY += 20;
            doc.text('DEPT:', infoX, infoY);
            doc.text('Academic Affairs', infoX + 45, infoY);
            
            infoY += 20;
            doc.text('STATUS:', infoX, infoY);
            doc.fill('#059669').text('ACTIVE FACULTY', infoX + 45, infoY);
            
            // Barcode area
            doc.rect(15, 175, 320, 35).fill('#F3F4F6');
            
            let barcodeX = 25;
            for (let i = 0; i < 40; i++) {
                const width = Math.random() > 0.5 ? 2 : 4;
                const height = 20 + Math.random() * 5;
                doc.rect(barcodeX, 180, width, height).fill('#000000');
                barcodeX += width + 2 + Math.floor(Math.random() * 3);
                if (barcodeX > 320) break;
            }
            
            doc.fontSize(7)
               .fill('#374151')
               .text(generateBarcode(), 15, 202, { width: 320, align: 'center' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
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
