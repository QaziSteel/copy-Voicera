/**
 * Security utility for masking customer PII based on user role
 */

/**
 * Masks a phone number to show only the last 4 digits
 * @param phoneNumber - The full phone number
 * @returns Masked phone number (e.g., "***-***-1234")
 */
export const maskPhoneNumber = (phoneNumber: string | null): string => {
  if (!phoneNumber) return 'N/A';
  const lastFour = phoneNumber.slice(-4);
  return `***-***-${lastFour}`;
};

/**
 * Masks a customer name to show only the first letter
 * @param name - The full customer name
 * @returns Masked name (e.g., "J***")
 */
export const maskCustomerName = (name: string | null): string => {
  if (!name) return 'N/A';
  return `${name.charAt(0)}***`;
};

/**
 * Returns customer data with proper masking based on permission level
 * @param data - Object containing customer_name and customer_number
 * @param canViewCustomerData - Whether the user has permission to view full customer data
 * @returns Object with appropriately masked or full customer data
 */
export const getMaskedCustomerData = <T extends { customer_name?: string | null; customer_number?: string | null }>(
  data: T,
  canViewCustomerData: boolean
): T => {
  if (canViewCustomerData) {
    return data;
  }

  return {
    ...data,
    customer_name: data.customer_name ? maskCustomerName(data.customer_name) : null,
    customer_number: data.customer_number ? maskPhoneNumber(data.customer_number) : null,
  };
};

/**
 * Returns booking customer data with proper masking
 * @param bookingCustomerName - The booking customer name
 * @param canViewCustomerData - Whether the user has permission to view full customer data
 * @returns Masked or full customer name
 */
export const getMaskedBookingCustomerName = (
  bookingCustomerName: string | null,
  canViewCustomerData: boolean
): string | null => {
  if (!bookingCustomerName) return null;
  if (canViewCustomerData) return bookingCustomerName;
  return maskCustomerName(bookingCustomerName);
};
