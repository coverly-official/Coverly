"use client";

import { useSyncExternalStore } from "react";
import { getInsforge } from "@/lib/insforge";
import { loadAccountUser, signOutUser, type AccountUser } from "@/lib/auth";

export interface AuthState {
  status: "loading" | "signed-in" | "signed-out";
  user: AccountUser | null;
}

const SERVER_STATE: AuthState = { status: "loading", user: null };

let state: AuthState = SERVER_STATE;
let started = false;
const listeners = new Set<() => void>();

function emit(next: AuthState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export async function refreshAuth(): Promise<void> {
  const client = getInsforge();
  if (!client) {
    emit({ status: "signed-out", user: null });
    return;
  }
  try {
    const { data } = await client.auth.getCurrentUser();
    const user = data?.user ? await loadAccountUser(data.user) : null;
    emit(
      user ? { status: "signed-in", user } : { status: "signed-out", user: null }
    );
  } catch {
    emit({ status: "signed-out", user: null });
  }
}

export async function logOut(): Promise<void> {
  await signOutUser();
  emit({ status: "signed-out", user: null });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!started) {
    started = true;
    void refreshAuth();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  );
}