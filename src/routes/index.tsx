import { createAsync, query, revalidate } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { createMemo, createSignal, Show } from "solid-js";
import { db } from "~/db";
import { entriesTable } from "~/db/schema";

const getEntries = query(async () => {
  "use server";

  return await db.select().from(entriesTable);
}, "entries");

async function createEntry() {
  "use server";

  await db.insert(entriesTable).values({ content: "" });
}

async function saveEntry(id: number, content: string) {
  "use server";

  await db.update(entriesTable).set({ content }).where(eq(entriesTable.id, id));
}

async function deleteEntry(id: number) {
  "use server";

  await db.delete(entriesTable).where(eq(entriesTable.id, id));
}

export default function Home() {
  const [i, setI] = createSignal(0);
  const [id, setId] = createSignal(0);
  const [content, setContent] = createSignal("");
  const entries = createAsync(() => getEntries());

  createMemo(() => {
    const entry = entries()?.[i()];
    if (entry) {
      setId(entry.id);
      setContent(entry.content);
    }
  });

  const edited = createMemo(() => {
    const entry = entries()?.[i()];
    if (entry) {
      return entry.content !== content();
    }
    return true;
  });

  return (
    <main class="container flex items-center" style="height: 100vh;">
      <div class="w-100 align-center">
        <Show when={entries()}>
          {(entries) => (
            <Show
              when={entries().length !== 0}
              fallback={
                <div class="vstack">
                  Nothing here
                  <button
                    type="button"
                    class="large outline"
                    onclick={async () => {
                      await createEntry();
                      await revalidate(getEntries.key);
                      setI(entries().length - 1);
                    }}
                  >
                    New
                  </button>
                </div>
              }
            >
              <textarea
                value={content()}
                oninput={(e) => setContent(e.target.value)}
                placeholder="Empty"
                rows="5"
              >
                {content()}
              </textarea>
              <div class="hstack justify-between">
                <button
                  type="button"
                  class="large outline"
                  onclick={async () => {
                    if (edited()) {
                      await saveEntry(id(), content());
                      await revalidate(getEntries.key);
                    } else {
                      await createEntry();
                      await revalidate(getEntries.key);
                      setI(entries().length - 1);
                    }
                  }}
                >
                  {edited() ? "Save" : "New"}
                </button>
                <button
                  type="button"
                  class="large"
                  onclick={() => setI((i() + 1) % entries().length)}
                >
                  Next
                </button>
                <button
                  type="button"
                  data-variant="danger"
                  class="large"
                  commandfor="delete-dialog"
                  command="show-modal"
                >
                  Delete
                </button>
              </div>
            </Show>
          )}
        </Show>
      </div>

      <dialog id="delete-dialog">
        <form
          method="dialog"
          onsubmit={async () => {
            await deleteEntry(id());
            await revalidate(getEntries.key);
            setI(Math.max(entries()!.length - 1, 0));
          }}
        >
          <header>
            <h3>Delete entry</h3>
          </header>
          <div>
            <textarea readonly value={content()} rows="5"></textarea>
          </div>
          <footer>
            <button
              type="button"
              commandfor="delete-dialog"
              command="close"
              class="outline"
            >
              Cancel
            </button>
            <button type="submit" data-variant="danger">
              Delete
            </button>
          </footer>
        </form>
      </dialog>
    </main>
  );
}
