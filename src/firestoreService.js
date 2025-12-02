import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";

// Read all offers
export async function getOffers() {
  const offersCollection = collection(db, "offers");
  const offersSnapshot = await getDocs(offersCollection);
  const offersList = offersSnapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  console.log("Fetched Offers:", offersList);
  return offersList;
}

// Add a single offer/order
export async function addOffer(offerData) {
  const col = collection(db, "offers");
  const docRef = await addDoc(col, {
    ...offerData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Add multiple offers using a batch
export async function addOffersBulk(offersArray) {
  if (!Array.isArray(offersArray) || offersArray.length === 0) return [];
  const batch = writeBatch(db);
  const ids = [];
  offersArray.forEach((item) => {
    const ref = doc(collection(db, "offers"));
    batch.set(ref, { ...item, createdAt: serverTimestamp() });
    ids.push(ref.id);
  });
  await batch.commit();
  return ids;
}

// Add an order (separate collection)
export async function addOrder(orderData) {
  const col = collection(db, "orders");
  const docRef = await addDoc(col, {
    ...orderData,
    createdAt: orderData && orderData.createdAt ? orderData.createdAt : serverTimestamp(),
  });
  return docRef.id;
}

export default { getOffers, addOffer, addOffersBulk, addOrder };
