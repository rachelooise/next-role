"use client";

import { useState, type ReactElement } from "react";

export function ConnectedAccounts(): ReactElement {
  const [message, setMessage] = useState("");

  return (
    <section className="app-card space-y-6" aria-labelledby="connected-accounts-heading">
      <div>
        <h2 id="connected-accounts-heading" className="app-heading">Connected Accounts</h2>
        <p className="app-muted mt-1">Manage your LinkedIn connection.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-linkedin-light text-lg font-semibold text-linkedin">in</span>
          <div>
            <h3 className="text-sm font-medium text-text-primary">LinkedIn</h3>
            <p className="app-muted mt-1">Not connected</p>
          </div>
        </div>
        <button
          type="button"
          className="app-primary"
          aria-describedby="linkedin-connection-note"
          onClick={() => setMessage("LinkedIn connection is not available yet. Your account has not been connected.")}
        >
          Connect LinkedIn
        </button>
      </div>
      <p id="linkedin-connection-note" className="app-muted">LinkedIn connection is coming soon.</p>
      {message && <p role="status" className="text-sm text-text-secondary">{message}</p>}
    </section>
  );
}
