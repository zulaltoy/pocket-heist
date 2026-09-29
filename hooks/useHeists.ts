"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  type FirestoreDataConverter,
  type FirestoreError,
  type Query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUser } from "@/hooks/useUser";
import { COLLECTIONS, heistConverter, type Heist } from "@/types/firestore";

export type HeistsMode = "active" | "assigned" | "expired";

function buildQuery(
  mode: HeistsMode,
  uid: string | undefined,
  now: Date,
): Query<Heist> | null {
  // heistConverter.toFirestore accepts Partial<Heist>, which doesn't line up
  // with the SDK's WithFieldValue<Heist>; reads are unaffected.
  const heists = collection(db, COLLECTIONS.HEISTS).withConverter(
    heistConverter as FirestoreDataConverter<Heist>,
  );

  switch (mode) {
    case "active":
      return uid
        ? query(
            heists,
            where("assignedTo", "==", uid),
            where("deadline", ">", now),
            orderBy("deadline", "asc"),
          )
        : null;
    case "assigned":
      return uid
        ? query(
            heists,
            where("createdBy", "==", uid),
            where("deadline", ">", now),
            orderBy("deadline", "asc"),
          )
        : null;
    case "expired":
      return query(
        heists,
        where("deadline", "<=", now),
        where("finalStatus", "!=", null),
        orderBy("deadline", "desc"),
      );
  }
}

export function useHeists(mode: HeistsMode) {
  const { user } = useUser();
  const uid = user?.uid;
  const [heists, setHeists] = useState<Heist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    const q = buildQuery(mode, uid, new Date());
    if (!q) return;

    return onSnapshot(
      q,
      (snapshot) => {
        setHeists(snapshot.docs.map((doc) => doc.data()));
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setHeists([]);
        setError(err);
        setLoading(false);
      },
    );
  }, [mode, uid]);

  return { heists, loading, error };
}
