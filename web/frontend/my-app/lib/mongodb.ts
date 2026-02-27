import { MongoClient, Db, Collection } from "mongodb";

const MONGODB_URI = "mongodb+srv://dhanvantari-static:dhanvantari1234@cluster0.ccev0.mongodb.net/";
const DB_NAME = "dhanvantari";
const COLLECTION_NAME = "user_profiles";

console.log("[MongoDB] Initializing MongoDB connection");
console.log("[MongoDB] URI:", MONGODB_URI?.substring(0, 30) + "...");
console.log("[MongoDB] Database:", DB_NAME);
console.log("[MongoDB] Collection:", COLLECTION_NAME);

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  console.log("[MongoDB] connectToDatabase() called");
  console.log("[MongoDB] Cache status - Client:", !!cachedClient, "DB:", !!cachedDb);

  if (cachedClient && cachedDb) {
    console.log("[MongoDB] ✓ Using cached connection");
    return { client: cachedClient, db: cachedDb };
  }

  console.log("[MongoDB] Creating new MongoDB connection...");
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("[MongoDB] Attempting to connect...");
    await client.connect();
    console.log("[MongoDB] ✓ Connected to MongoDB server");

    const db = client.db(DB_NAME);
    console.log("[MongoDB] ✓ Database instance created:", DB_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log("[MongoDB] ✓ Connection cached");
    return { client, db };
  } catch (error) {
    console.error("[MongoDB] ✗ Connection failed:", error);
    throw new Error("Failed to connect to database");
  }
}

export async function getProfileCollection(): Promise<Collection> {
  console.log("[MongoDB] getProfileCollection() called");
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION_NAME);
    console.log("[MongoDB] ✓ Collection retrieved:", COLLECTION_NAME);
    return collection;
  } catch (error) {
    console.error("[MongoDB] ✗ Failed to get collection:", error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  console.log("[MongoDB] getUserProfile() called for userId:", userId);
  try {
    const collection = await getProfileCollection();
    console.log("[MongoDB] Querying for profile with userId:", userId);

    const profile = await collection.findOne({ userId });

    if (profile) {
      console.log("[MongoDB] ✓ Profile found:", profile._id);
    } else {
      console.log("[MongoDB] Profile not found for userId:", userId);
    }

    return profile;
  } catch (error) {
    console.error("[MongoDB] ✗ Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

export async function createUserProfile(userId: string, profileData: any) {
  console.log("[MongoDB] createUserProfile() called for userId:", userId);
  console.log("[MongoDB] Profile data:", profileData);

  try {
    const collection = await getProfileCollection();

    const newProfile = {
      userId,
      ...profileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("[MongoDB] Inserting profile into database...");
    const result = await collection.insertOne(newProfile);

    console.log("[MongoDB] ✓ Profile created with ID:", result.insertedId);
    console.log("[MongoDB] Inserted document:", newProfile);

    return newProfile;
  } catch (error) {
    console.error("[MongoDB] ✗ Error creating profile:", error);
    throw new Error("Failed to create profile");
  }
}

export async function updateUserProfile(userId: string, profileData: any) {
  console.log("[MongoDB] updateUserProfile() called for userId:", userId);
  console.log("[MongoDB] Update data:", profileData);

  try {
    const collection = await getProfileCollection();

    console.log("[MongoDB] Updating profile in database...");
    const result = await collection.updateOne(
      { userId },
      {
        $set: {
          ...profileData,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    console.log("[MongoDB] Update result - Matched:", result.matchedCount, "Modified:", result.modifiedCount);

    if (result.matchedCount === 0) {
      console.error("[MongoDB] ✗ Profile not found for update");
      throw new Error("Profile not found");
    }

    console.log("[MongoDB] ✓ Profile updated successfully");
    return result;
  } catch (error) {
    console.error("[MongoDB] ✗ Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
}

export async function deleteUserProfile(userId: string) {
  console.log("[MongoDB] deleteUserProfile() called for userId:", userId);

  try {
    const collection = await getProfileCollection();

    console.log("[MongoDB] Deleting profile from database...");
    const result = await collection.deleteOne({ userId });

    console.log("[MongoDB] Delete result - Deleted:", result.deletedCount);

    if (result.deletedCount === 0) {
      console.error("[MongoDB] ✗ Profile not found for deletion");
      throw new Error("Profile not found");
    }

    console.log("[MongoDB] ✓ Profile deleted successfully");
    return result;
  } catch (error) {
    console.error("[MongoDB] ✗ Error deleting profile:", error);
    throw new Error("Failed to delete profile");
  }
}
