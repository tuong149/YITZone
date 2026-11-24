export const qk = {
  /**
   * Builds a user- and scope-isolated query key for private/authenticated data so
   * shared BTC devices never leak cached records across accounts or unit scopes.
   */
  private: (
    userId,
    activeScopeId,
    ...parts
  ) => ["private", userId ?? "anonymous", activeScopeId, ...parts],

  public: (...parts) => ["public", ...parts]
};
