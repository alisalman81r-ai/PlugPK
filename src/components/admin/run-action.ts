// src/components/admin/run-action.ts

export interface ActionOutcome {
  ok: boolean
  message?: string
}

/**
 * Calls a server action and always comes back with an outcome.
 *
 * The admin actions answer `{ ok, message }`, but a server action can still
 * reject — the network drops, the deployment changed under an open tab, an
 * action owned by another module throws. Every admin control used to await the
 * action bare, so a rejection skipped the line that cleared the spinner and the
 * row sat on "Deleting" until the page was reloaded. This turns a rejection
 * into an ordinary failure with a sentence the control can show.
 */
export async function runAction<T extends ActionOutcome>(
  action: () => Promise<T>,
): Promise<T | (ActionOutcome & { ok: false; message: string })> {
  try {
    return await action()
  } catch (error) {
    console.error('[admin] action failed', error)
    return {
      ok: false,
      message: 'That did not reach the server, or your session has ended. Reload the page and try again.',
    }
  }
}
