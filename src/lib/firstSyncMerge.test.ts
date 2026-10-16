import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeFirstSync } from './firstSyncMerge';

test('lista do aparelho vale quando tem itens (o que foi apagado continua apagado)', () => {
  const m = mergeFirstSync({ expenses: [{ id: 'a' }, { id: 'b' }] }, { expenses: [{ id: 'a' }] });
  assert.deepEqual(m.expenses, [{ id: 'a' }]);
});

test('lista vazia ou ausente no aparelho usa a da nuvem', () => {
  assert.deepEqual(mergeFirstSync({ cards: [{ id: 'c' }] }, { cards: [] }).cards, [{ id: 'c' }]);
  assert.deepEqual(mergeFirstSync({ cards: [{ id: 'c' }] }, {}).cards, [{ id: 'c' }]);
});

test('aparelho com dados e nuvem vazia mantém os dados do aparelho', () => {
  assert.deepEqual(mergeFirstSync({ people: [] }, { people: [{ id: 'p' }] }).people, [{ id: 'p' }]);
});

test('objetos: chaves do aparelho sobrescrevem, sem remover as da nuvem', () => {
  const m = mergeFirstSync({ monthlyTargets: { a: 1, b: 2 } }, { monthlyTargets: { b: 9 } });
  assert.deepEqual(m.monthlyTargets, { a: 1, b: 9 });
});

test('plano de assinatura vem sempre da nuvem, nunca do aparelho', () => {
  const m = mergeFirstSync(
    { profile: { name: 'Ana', planId: 'pro', subscriptionStatus: 'active' } },
    { profile: { name: 'Ana Local', planId: 'hack', subscriptionStatus: 'active', customerId: 'x' } });
  assert.equal(m.profile.name, 'Ana Local');
  assert.equal(m.profile.planId, 'pro');
  assert.equal('customerId' in m.profile, false);
});

test('plano do aparelho é descartado quando a nuvem não tem plano', () => {
  const m = mergeFirstSync({ profile: { name: 'Ana' } }, { profile: { name: 'Ana', planId: 'pro' } });
  assert.equal('planId' in m.profile, false);
});

test('não altera os objetos recebidos', () => {
  const cloud = { expenses: [{ id: 'b' }], profile: { name: 'A', planId: 'pro' } };
  const local = { expenses: [{ id: 'a' }], profile: { name: 'B', planId: 'x' } };
  const c = JSON.stringify(cloud), l = JSON.stringify(local);
  mergeFirstSync(cloud, local);
  assert.equal(JSON.stringify(cloud), c);
  assert.equal(JSON.stringify(local), l);
});
