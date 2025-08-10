import {Client, Databases, ID, Query} from 'appwrite'

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;

const client = new Client()
    .setEndpoint('.setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT')
    .setProject(PROJECT_ID)

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, player) => {
    try {
        // Group by player_id instead of searchTerm
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('player_id', String(player.id)),
         ])
        if (result.documents.length > 0) {
            const doc = result.documents[0];
            await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
                count: doc.count+1,
                // Optionally update searchTerm to the latest search
                searchTerm,
            })
        } else {
            await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                searchTerm, 
                count: 1, 
                player_id: String(player.id),
                headshot_url: player.headshot?.href || '',
                name: player.fullName,
                position: player.position?.abbreviation || '',
                team: player.team?.displayName || '',
                espnID: parseInt(player.id)
            })
        }
    } catch (error) {
        console.error(error);
    }
}

export const getTrendingPlayers = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5),
            Query.orderDesc("count")
        ])
        return result.documents;
    } catch (error) {
        console.log(error);
    }
}