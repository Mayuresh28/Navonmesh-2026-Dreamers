import { MongoClient, Db, Collection, MongoClientOptions } from "mongodb";

// ─── Connection Configuration ────────────────────────────────────────────────
const MONGODB_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://dhanvantari-static:dhanvantari1234@cluster0.ccev0.mongodb.net/";
const DB_NAME = "dhanvantari";
const PROFILE_COLLECTION = "user_profiles";
const options: MongoClientOptions = {};

// ─── Shared client promise (used by health-analyze / dynamic_data) ───────────
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In dev mode, preserve across HMR reloads via a global variable.
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

// Default export — consumed by health-analyze route (dynamic_data collection)
export default clientPromise;

// ─── Helper: get database instance from the shared client ────────────────────
async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db(DB_NAME);
}

// ─── Compute derived health parameters from raw profile data ─────────────────
function computeDerivedFields(data: Record<string, unknown>): Record<string, unknown> {
  const age = Number(data.age) || 0;
  const height = Number(data.height) || 0; // cm
  const weight = Number(data.weight) || 0; // kg
  const familyHistory = String(data.familyHistory ?? "").trim();
  const smokingStatus = String(data.smokingStatus ?? "never");
  const alcoholUse = String(data.alcoholUse ?? "never");

  // 1) BMI = Weight / (Height_m)^2
  const heightM = height / 100;
  const bmi = heightM > 0 ? parseFloat((weight / (heightM * heightM)).toFixed(1)) : 0;

  // 2) Genetic Risk Score (weighted 0–1)
  //    Family history + smoking + alcohol contributions
  let geneticRiskScore = 0;
  if (familyHistory.length > 0) geneticRiskScore += 0.4;
  if (smokingStatus === "current") geneticRiskScore += 0.3;
  else if (smokingStatus === "former") geneticRiskScore += 0.15;
  if (alcoholUse === "heavy") geneticRiskScore += 0.3;
  else if (alcoholUse === "moderate") geneticRiskScore += 0.15;
  else if (alcoholUse === "occasional") geneticRiskScore += 0.05;
  geneticRiskScore = parseFloat(Math.min(geneticRiskScore, 1).toFixed(2));

  // 3) Age Risk Multiplier = 1 + Age/100, boosted by lifestyle
  let ageRiskMultiplier = 1 + age / 100;
  if (smokingStatus === "current") ageRiskMultiplier += 0.15;
  else if (smokingStatus === "former") ageRiskMultiplier += 0.05;
  if (alcoholUse === "heavy") ageRiskMultiplier += 0.1;
  else if (alcoholUse === "moderate") ageRiskMultiplier += 0.05;
  ageRiskMultiplier = parseFloat(ageRiskMultiplier.toFixed(2));

  return { bmi, geneticRiskScore, ageRiskMultiplier };
}

// ─── Profile collection helpers (user_profiles collection) ───────────────────
export async function getProfileCollection(): Promise<Collection> {
  const db = await getDb();
  return db.collection(PROFILE_COLLECTION);
}

export async function getUserProfile(userId: string) {
  const collection = await getProfileCollection();
  return collection.findOne({ userId });
}

export async function createUserProfile(userId: string, profileData: Record<string, unknown>) {
  const collection = await getProfileCollection();
  const derived = computeDerivedFields(profileData);

  const newProfile = {
    userId,
    ...profileData,
    ...derived,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await collection.insertOne(newProfile);
  return newProfile;
}

export async function updateUserProfile(userId: string, profileData: Record<string, unknown>) {
  const collection = await getProfileCollection();

  // Merge existing data with incoming to recompute derived fields
  const existing = await collection.findOne({ userId });
  const merged = { ...(existing ?? {}), ...profileData };
  const derived = computeDerivedFields(merged);

  const result = await collection.updateOne(
    { userId },
    {
      $set: {
        ...profileData,
        ...derived,
        updatedAt: new Date().toISOString(),
      },
    }
  );

  if (result.matchedCount === 0) {
    throw new Error("Profile not found");
  }

  return result;
}

export async function deleteUserProfile(userId: string) {
  const collection = await getProfileCollection();

  const result = await collection.deleteOne({ userId });

  if (result.deletedCount === 0) {
    throw new Error("Profile not found");
  }

  return result;
}
