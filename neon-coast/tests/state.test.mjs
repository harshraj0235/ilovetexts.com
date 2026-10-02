import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACTS, readSave, advanceMission } from '../src/game-state.js';

test('missing, malformed, and invalid saves recover safely', () => {
  for (const value of [null, '{broken', '{}', '{"cash":"bad","completed":-3}']) {
    const save = readSave(value); assert.equal(save.cash, 500); assert.equal(save.completed, 0);
  }
  assert.deepEqual(readSave('{"cash":1200,"completed":3}'), { cash: 1200, completed: 3 });
  assert.equal(readSave('{"cash":-10}').cash, 0);
});
test('contracts require entering each checkpoint in order in a vehicle', () => {
  for (const contract of CONTRACTS) {
    const mission = { contract, stage: 0 };
    assert.equal(advanceMission(mission, 500, 500, true), false);
    for (let stage = 0; stage < contract.points.length; stage++) {
      const [x, z] = contract.points[stage];
      assert.equal(advanceMission(mission, x, z, false), false);
      assert.equal(mission.stage, stage);
      assert.equal(advanceMission(mission, x, z, true), true);
      assert.equal(mission.stage, stage + 1);
    }
  }
});
