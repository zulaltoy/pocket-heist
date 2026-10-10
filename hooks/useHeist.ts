"use client";

import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  type FirestoreDataConverter,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, heistConverter, type Heist } from "@/types/firestore";

export function useHeist(id: string) {
  const [heist, setHeist] = useState<Heist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    // See useHeists for why the converter cast is needed.
    const ref = doc(db, COLLECTIONS.HEISTS, id).withConverter(
      heistConverter as FirestoreDataConverter<Heist>,
    );

    return onSnapshot(
      ref,
      (snapshot) => {
        setHeist(snapshot.exists() ? snapshot.data() : null);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setHeist(null);
        setError(err);
        setLoading(false);
      },
    );
  }, [id]);

  return { heist, loading, error };
}
