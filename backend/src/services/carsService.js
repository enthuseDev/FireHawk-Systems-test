const { carsCollection } = require('../firestoreAdmin');

async function listCarsFromFirestore() {
  // Dataset is small enough for a full read + server-side filter/sort.
  const snap = await carsCollection().get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  }));
}

module.exports = { listCarsFromFirestore };

