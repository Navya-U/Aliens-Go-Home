import {
  createInterval,
  flyingObjectsStarterYAxis,
  maxFlyingObjects,
  flyingObjectsStarterPositions,
} from '../utils/Constants';

export default (state) => {
  if (!state.gameState.started) return state; // game not running

  const now = new Date().getTime();
  const { lastObjectCreatedAt, flyingObjects } = state.gameState;

  const createNewObject =
    now - lastObjectCreatedAt > createInterval &&
    flyingObjects.length < maxFlyingObjects;

  if (!createNewObject) return state;

  const id = now;
  const predefinedPosition = Math.floor(Math.random() * maxFlyingObjects);
  const flyingObjectPosition =
    flyingObjectsStarterPositions[predefinedPosition];
  const newFlyingObject = {
    position: {
      x: flyingObjectPosition,
      y: flyingObjectsStarterYAxis,
    },
    createdAt: now,
    id,
  };

  return {
    ...state,
    gameState: {
      ...state.gameState,
      flyingObjects: [...state.gameState.flyingObjects, newFlyingObject],
      lastObjectCreatedAt: now,
    },
  };
};
