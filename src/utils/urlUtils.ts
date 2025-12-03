/**
 * Removes ID-related content from messages/text
 * This helps hide IDs from being displayed in toast notifications and other UI text
 */
export function removeIdFromMessage(message: string): string {
  if (!message || typeof message !== 'string') return message;
  
  // Remove ID patterns like "for session [UUID]", "with ID [UUID]", etc. (remove the whole phrase)
  let cleaned = message.replace(/\s+for\s+(?:session|contract|user|tutor|child|report|booking|notification|message|package|center|school)\s+[a-fA-F0-9-]{8,}/gi, '');
  cleaned = cleaned.replace(/\s+with\s+(?:id|ID|Id)\s+[a-fA-F0-9-]{8,}/gi, '');
  cleaned = cleaned.replace(/\s+\([^)]*(?:[Ii][Dd]|session|contract|user|tutor|child|report|booking|notification|message|package|center|school)[^)]*[a-fA-F0-9-]{8,}[^)]*\)/gi, '');
  
  // Remove UUIDs (8-4-4-4-12 format) - remove completely, not replace with [ID]
  cleaned = cleaned.replace(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/gi, '');
  
  // Remove long alphanumeric IDs (32+ chars) - remove completely
  cleaned = cleaned.replace(/[a-fA-F0-9]{32,}/gi, '');
  
  // Remove any remaining "[ID]" text
  cleaned = cleaned.replace(/\s*\[ID\]/gi, '');
  cleaned = cleaned.replace(/\[ID\]\s*/gi, '');
  
  // Remove patterns like "for session [ID]", "with ID [ID]", etc.
  cleaned = cleaned.replace(/\s+for\s+(?:session|contract|user|tutor|child|report|booking|notification|message|package|center|school)\s*\[ID\]/gi, '');
  cleaned = cleaned.replace(/\s+with\s+(?:id|ID|Id)\s*\[ID\]/gi, '');
  
  // Clean up extra spaces and punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\s+\./g, '.'); // Remove space before period
  cleaned = cleaned.replace(/\s+,/g, ','); // Remove space before comma
  
  return cleaned || message; // Return original if cleaned is empty
}

/**
 * Removes ID-related parameters and segments from URLs
 * This helps hide IDs from being displayed in the UI
 */
export function removeIdFromUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  try {
    const urlObj = new URL(url);
    
    // Remove ID-related query parameters
    const idParams = [
      'id', 'Id', 'ID',
      'contractId', 'ContractId', 'contract_id',
      'userId', 'UserId', 'user_id',
      'tutorId', 'TutorId', 'tutor_id',
      'childId', 'ChildId', 'child_id',
      'reportId', 'ReportId', 'report_id',
      'bookingId', 'BookingId', 'booking_id',
      'notificationId', 'NotificationId', 'notification_id',
      'messageId', 'MessageId', 'message_id',
      'sessionId', 'SessionId', 'session_id',
      'packageId', 'PackageId', 'package_id',
      'centerId', 'CenterId', 'center_id',
      'schoolId', 'SchoolId', 'school_id',
    ];
    
    idParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    // Remove ID-like path segments (UUIDs or long alphanumeric strings)
    // This regex matches UUIDs and long IDs in path segments
    const pathSegments = urlObj.pathname.split('/').map(segment => {
      // Match UUIDs (8-4-4-4-12 format) or long alphanumeric IDs (32+ chars)
      if (/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(segment) ||
          /^[a-fA-F0-9]{32,}$/.test(segment)) {
        return '[ID]';
      }
      return segment;
    });
    urlObj.pathname = pathSegments.join('/');
    
    // Reconstruct URL
    let cleanedUrl = urlObj.toString();
    
    // Clean up any remaining ID patterns in the URL string
    cleanedUrl = cleanedUrl
      .replace(/[?&](?:id|Id|ID|contractId|ContractId|contract_id|userId|UserId|user_id|tutorId|TutorId|tutor_id|childId|ChildId|child_id|reportId|ReportId|report_id|bookingId|BookingId|booking_id|notificationId|NotificationId|notification_id|messageId|MessageId|message_id|sessionId|SessionId|session_id|packageId|PackageId|package_id|centerId|CenterId|center_id|schoolId|SchoolId|school_id)=[^&]*/gi, '')
      .replace(/[?&]$/, '') // Remove trailing ? or &
      .replace(/\?&/, '?') // Fix double separators
      .replace(/&&/g, '&'); // Fix double ampersands
    
    return cleanedUrl;
  } catch (error) {
    // If URL parsing fails, try simple string replacement
    let cleaned = url;
    
    // Remove ID query parameters
    cleaned = cleaned.replace(/[?&](?:id|Id|ID|contractId|ContractId|contract_id|userId|UserId|user_id|tutorId|TutorId|tutor_id|childId|ChildId|child_id|reportId|ReportId|report_id|bookingId|BookingId|booking_id|notificationId|NotificationId|notification_id|messageId|MessageId|message_id|sessionId|SessionId|session_id|packageId|PackageId|package_id|centerId|CenterId|center_id|schoolId|SchoolId|school_id)=[^&\s]*/gi, '');
    
    // Clean up separators
    cleaned = cleaned.replace(/[?&]$/, '').replace(/\?&/, '?').replace(/&&/g, '&');
    
    return cleaned || url;
  }
}

