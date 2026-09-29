import {
  DocumentData,
  FieldValue,
  QueryDocumentSnapshot,
} from "firebase/firestore";

export type HeistFinalStatus = "success" | "failure";

// Document — what you read from Firestore (after conversion)
export interface Heist {
  id: string;
  createdAt: Date;
  title: string;
  description: string;
  createdBy: string; // uid
  createdByCodename: string;
  assignedTo: string; // uid
  assignedToCodename: string;
  deadline: Date; // 48 hours after createdAt
  finalStatus: HeistFinalStatus | null; // null until the heist is resolved
}

// Create Input — what you pass to addDoc
export interface CreateHeistInput {
  createdAt: FieldValue; // serverTimestamp()
  title: string;
  description: string;
  createdBy: string;
  createdByCodename: string;
  assignedTo: string;
  assignedToCodename: string;
  deadline: Date; // automatically set to 48 hours after createdAt
  finalStatus: null;
}

// Update Input — partial fields for updateDoc (no createdAt)
export interface UpdateHeistInput {
  title?: string;
  description?: string;
  createdBy?: string;
  createdByCodename?: string;
  assignedTo?: string;
  assignedToCodename?: string;
  deadline?: Date;
  finalStatus?: HeistFinalStatus | null;
}

export const HEIST_DURATION_MS = 48 * 60 * 60 * 1000;

export const heistConverter = {
  toFirestore: (data: Partial<Heist>): DocumentData => data,

  fromFirestore: (snapshot: QueryDocumentSnapshot): Heist => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      deadline: data.deadline?.toDate(),
    } as Heist;
  },
};
