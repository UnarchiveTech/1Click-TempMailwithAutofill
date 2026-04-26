export interface OnboardingSetters {
  onCreateInbox: (provider: string) => void;
}

export async function handleCreateInbox(
  provider: string,
  ext: typeof browser,
  setters: OnboardingSetters
): Promise<void> {
  // Save selected provider to storage
  await ext.storage.local.set({ selectedProvider: provider });
  setters.onCreateInbox(provider);
}
