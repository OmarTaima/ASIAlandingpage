import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_CRM_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add order (public endpoint)
export async function addOrder(orderData) {
  try {
    // Prepare the lead data — exclude `orderOnly` so order-only fields
    // (like customer notes intended only for the order) are not sent to lead
    const { shippingFee, totalDiscount, items, orderOnly, ...leadData } = orderData;
    const response = await api.post('/lead/public', leadData);
    const transformedItems = items.map((item) => ({
      ...item,
      quantity: String(item.quantity), // Convert quantity to string
    }));
    const orderPayload = {
      lead: response.data.lead._id, // 👈 Attach the created lead's _id
      company: orderData.company,
      branch: orderData.branch,
      totalDiscount: orderData.totalDiscount,
      shippingFee: orderData.shippingFee,
      items: transformedItems,
      // merge any order-only fields here so they are sent to the order endpoint
      ...(orderOnly || {}),
    };
    const orderResult = await api.post('/order/public', orderPayload);
    return orderResult.data;
  } catch (error) {
    throw error; // Re-throw to handle in calling code
  }
}


/**
 * Fetch countries (public)
 * Returns the full axios response so callers can access `.data` as before
 */
export async function fetchCountries(params = { deleted: false, PageCount: 1000, page: 1 }) {
  // Use CRM backend API for location endpoints so env VITE_CRM_BACKEND_URL is used
  return api.get('/country/public', { params });
}

/**
 * Fetch all cities (public)
 */
export async function fetchCities(params = { deleted: false, PageCount: 1000, page: 1 }) {
  // Prefer CRM backend for city endpoints to ensure VITE_CRM_BACKEND_URL is respected
  return api.get('/city/public', { params });
}

/**
 * Fetch governorates for a country (public)
 */
export async function fetchGovernorates(params = { deleted: false, PageCount: 1000, page: 1, country: '' }) {
  // Use CRM backend for governorate endpoints so the configured CRM base URL is used
  return api.get('/government/public', { params });
}


export default { addOrder, fetchCountries, fetchCities, fetchGovernorates };
