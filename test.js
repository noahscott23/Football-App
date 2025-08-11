import { getLocalResponse, loadAllPlayers } from './src/chatLogic.js';

async function test() {
  await loadAllPlayers();
  const response = await getLocalResponse("Tell me about Lamar Jackson");
  console.log(response);
}

test().catch(console.error);
