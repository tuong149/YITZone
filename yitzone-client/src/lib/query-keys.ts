export const qk = {
  /**
   * Builds a user- and scope-isolated query key for private/authenticated data so
   * shared BTC devices never leak cached records across accounts or unit scopes.
   */
  private: (
    userId: string | null,
    activeScopeId: string,
    ...parts: readonly unknown[]
  ): readonly unknown[] => ["private", userId ?? "anonymous", activeScopeId, ...parts],

  public: (...parts: readonly unknown[]): readonly unknown[] => ["public", ...parts]
};
