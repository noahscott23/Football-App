import { Client, Databases, ID, Query } from 'appwrite';

// ✅ Load env vars
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;

// ✅ Debug log so you can see exactly what’s in prod
console.log("Appwrite ENV check:", {
  endpoint: ENDPOINT,
  projectId: PROJECT_ID,
  databaseId: DATABASE_ID,
  collectionId: COLLECTION_ID
});

// ✅ Fail early if env vars are missing
if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID || !COLLECTION_ID) {
  throw new Error("❌ Missing Appwrite environment variables in build!");
}

// ✅ Create client correctly (removed typo)
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

const database = new Databases(client);

// ------------------------------
// Update search count
// ------------------------------
export const updateSearchCount = async (searchTerm, player) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('player_id', String(player.id)),
    ]);

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
        count: doc.count + 1,
        searchTerm, // optional update
      });
    } else {
      await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        player_id: String(player.id),
        headshot_url: player.headshot?.href || '',
        name: player.fullName,
        position: player.position?.abbreviation || '',
        team: player.team?.displayName || '',
        espnID: parseInt(player.id),
      });
    }
  } catch (error) {
    console.error("Error in updateSearchCount:", error);
  }
};

// ------------------------------
// Get trending players
// ------------------------------
export const getTrendingPlayers = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count")
    ]);

    console.log("Trending players raw:", result);

    // Filter out broken URLs so prod won't crash
    return result.documents.map(doc => ({
      ...doc,
      headshot_url: doc.headshot_url || '/fallback-headshot.png'
    }));
  } catch (error) {
    console.error("Error fetching trending players:", error);
    return [];
  }
};
