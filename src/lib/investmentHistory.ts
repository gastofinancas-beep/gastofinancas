import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { InvestmentBoxHistory } from '../types';
import { todayLocalISO, parseLocalISO } from '../utils/dateUtils';

/**
 * Subcollection path helper:
 * users/{userId}/investmentBoxHistory/{boxId}/entries
 */
function getEntriesCollection(userId: string, boxId: string) {
  return collection(db, 'users', userId, 'investmentBoxHistory', boxId, 'entries');
}

/**
 * Busca todo o histórico de aportes e resgates de uma caixinha
 */
export async function getBoxHistory(userId: string, boxId: string): Promise<InvestmentBoxHistory[]> {
  if (!userId || !boxId) return [];

  const collectionPath = `users/${userId}/investmentBoxHistory/${boxId}/entries`;
  try {
    const entriesRef = getEntriesCollection(userId, boxId);
    let snapshot;
    try {
      // Tenta ordenar por data decrescente
      const q = query(entriesRef, orderBy('date', 'desc'));
      snapshot = await getDocs(q);
    } catch {
      // Fallback sem orderBy caso índice ainda esteja propagando
      snapshot = await getDocs(entriesRef);
    }

    const items: InvestmentBoxHistory[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        type: data.type === 'withdraw' ? 'withdraw' : 'deposit',
        amount: Number(data.amount) || 0,
        date: data.date || '',
        notes: data.notes || undefined,
      });
    });

    // Garante ordenação por data decrescente
    items.sort((a, b) => parseLocalISO(b.date).getTime() - parseLocalISO(a.date).getTime());

    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return [];
  }
}

/**
 * Adiciona uma entrada de histórico (depósito ou saque) na subcoleção do Firestore
 */
export async function addBoxHistoryEntry(
  userId: string,
  boxId: string,
  entry: Omit<InvestmentBoxHistory, 'id'>
): Promise<string> {
  if (!userId || !boxId) {
    throw new Error('userId and boxId are required to add box history');
  }

  const collectionPath = `users/${userId}/investmentBoxHistory/${boxId}/entries`;
  try {
    const entriesRef = getEntriesCollection(userId, boxId);
    const docRef = await addDoc(entriesRef, {
      type: entry.type,
      amount: Number(entry.amount) || 0,
      date: entry.date || todayLocalISO(),
      notes: entry.notes || '',
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    throw error;
  }
}

/**
 * Migra histórico legado (do campo history[] do documento raiz) para a subcoleção.
 * Deve ser chamada uma única vez por caixinha quando o usuário já tem dados.
 */
export async function migrateBoxHistoryIfNeeded(
  userId: string,
  boxId: string,
  legacyHistory: InvestmentBoxHistory[]
): Promise<void> {
  if (!userId || !boxId || !legacyHistory || legacyHistory.length === 0) {
    return;
  }

  const collectionPath = `users/${userId}/investmentBoxHistory/${boxId}/entries`;
  try {
    const entriesRef = getEntriesCollection(userId, boxId);
    const existingSnapshot = await getDocs(entriesRef);

    // Se a subcoleção já possui entradas registradas, não duplica
    if (!existingSnapshot.empty) {
      return;
    }

    // Salva cada registro da lista legada na subcoleção
    for (const item of legacyHistory) {
      const entryData = {
        type: item.type,
        amount: Number(item.amount) || 0,
        date: item.date || todayLocalISO(),
        notes: item.notes || '',
        createdAt: serverTimestamp(),
      };

      if (item.id) {
        await setDoc(doc(entriesRef, item.id), entryData);
      } else {
        await addDoc(entriesRef, entryData);
      }
    }
  } catch (error) {
    console.warn(`[migrateBoxHistoryIfNeeded] Falha na migração da box ${boxId}:`, error);
  }
}
