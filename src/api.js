import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://sge-commerce.onrender.com/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add order (public endpoint)
export async function addOrder(orderData) {
  try {
    // Prepare the lead data
    const { shippingFee, totalDiscount, items, ...leadData } = orderData;
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
    };
    const orderResult = await api.post('/order/public', orderPayload);
    return orderResult.data;
  } catch (error) {
    throw error; // Re-throw to handle in calling code
  }
}

export default { addOrder };
