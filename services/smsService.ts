
import { Student } from '../types';
import { storageService } from './storageService';

// Text.lk or similar API integration example
const SMS_API_URL = 'https://text.lk/api/v3/sms/send';
const SMS_API_TOKEN = 'YOUR_TEXT_LK_API_TOKEN'; // To be provided in env or settings
const SENDER_ID = 'ExcellenceE';

export const smsService = {
  /**
   * Sends a polite, short SMS to a parent.
   * Optimizes for 160 characters (1 SMS unit).
   */
  sendSMS: async (student: Student, message: string, category: 'Attendance' | 'Payment' | 'Reminder' | 'Announcement'): Promise<boolean> => {
    // Format phone for Sri Lanka
    let phone = student.contact.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '94' + phone.substring(1);
    } else if (!phone.startsWith('94')) {
      phone = '94' + phone;
    }

    console.log(`[SMS-GATEWAY] Sending to ${phone}: ${message}`);

    // Simulation of API call
    try {
      // In real scenario:
      /*
      const response = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${SMS_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          recipient: phone,
          sender_id: SENDER_ID,
          message: message,
          unicode: 1 // Enable for Sinhala/Tamil support
        })
      });
      const data = await response.json();
      if (!data.status) throw new Error(data.message);
      */

      // Log the success scoped to institutionId
      await storageService.logMessage(student.institutionId, {
        id: '',
        studentId: student.id,
        type: 'SMS',
        category,
        content: message,
        status: 'Sent',
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('SMS Gateway Error:', error);
      // Log the failure scoped to institutionId
      await storageService.logMessage(student.institutionId, {
        id: '',
        studentId: student.id,
        type: 'SMS',
        category,
        content: message,
        status: 'Failed',
        timestamp: Date.now()
      });
      return false;
    }
  }
};
