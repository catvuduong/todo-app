import { test, expect, type Page } from '@playwright/test';

const SEEDED = ['Water the plants', 'Plan the weekend hike', 'Read a chapter of a good book'];

function items(page: Page) {
  return page.getByTestId('todo-item');
}

function itemTitles(page: Page) {
  return items(page).getByTestId('todo-title').allTextContents();
}

async function addTodo(page: Page, title: string) {
  await page.getByTestId('new-todo-input').fill(title);
  await page.getByTestId('add-todo-button').click();
}

test.describe('todo app', () => {
  test('seeds three example todos on first load', async ({ page }) => {
    await page.goto('/');

    await expect(items(page)).toHaveCount(3);
    await expect.poll(() => itemTitles(page)).toEqual(SEEDED);
    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');
  });

  test('adds a todo from the input and clears the field', async ({ page }) => {
    await page.goto('/');

    await addTodo(page, '  Buy oat milk  ');

    await expect(items(page)).toHaveCount(4);
    await expect(items(page).last().getByTestId('todo-title')).toHaveText('Buy oat milk');
    await expect(page.getByTestId('new-todo-input')).toHaveValue('');
    await expect(page.getByTestId('todo-count')).toHaveText('3 items left');
  });

  test('adds a todo with the Enter key', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('new-todo-input').fill('Call mum');
    await page.getByTestId('new-todo-input').press('Enter');

    await expect(items(page)).toHaveCount(4);
    await expect(items(page).last().getByTestId('todo-title')).toHaveText('Call mum');
  });

  test('ignores blank input and disables the add button', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('add-todo-button')).toBeDisabled();

    await page.getByTestId('new-todo-input').fill('     ');
    await page.getByTestId('new-todo-input').press('Enter');

    await expect(items(page)).toHaveCount(3);
  });

  test('marks a todo done and back again', async ({ page }) => {
    await page.goto('/');

    const first = items(page).first();
    await expect(first).toHaveAttribute('data-done', 'false');

    await first.getByTestId('todo-toggle').check();
    await expect(first).toHaveAttribute('data-done', 'true');
    await expect(page.getByTestId('todo-count')).toHaveText('1 item left');

    await first.getByTestId('todo-toggle').uncheck();
    await expect(first).toHaveAttribute('data-done', 'false');
    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');
  });

  test('deletes a todo', async ({ page }) => {
    await page.goto('/');

    await items(page).nth(1).getByTestId('todo-delete').click();

    await expect(items(page)).toHaveCount(2);
    await expect.poll(() => itemTitles(page)).toEqual([SEEDED[0], SEEDED[2]]);
    await expect(page.getByTestId('todo-count')).toHaveText('1 item left');
  });

  test('edits a todo title and saves with Enter', async ({ page }) => {
    await page.goto('/');

    const first = items(page).first();
    await first.getByTestId('todo-edit').click();
    const input = first.getByTestId('todo-edit-input');
    await expect(input).toBeFocused();
    await input.fill('Water the ferns');
    await input.press('Enter');

    await expect(first.getByTestId('todo-title')).toHaveText('Water the ferns');
    await expect(page.getByTestId('todo-edit-input')).toHaveCount(0);
  });

  test('edits a todo title by double-clicking and saves on blur', async ({ page }) => {
    await page.goto('/');

    const second = items(page).nth(1);
    await second.getByTestId('todo-title').dblclick();
    await second.getByTestId('todo-edit-input').fill('Plan the summer hike');
    await page.getByTestId('app-title').click();

    await expect(second.getByTestId('todo-title')).toHaveText('Plan the summer hike');
  });

  test('keeps the original title when edit is cancelled with Escape', async ({ page }) => {
    await page.goto('/');

    const first = items(page).first();
    await first.getByTestId('todo-edit').click();
    await first.getByTestId('todo-edit-input').fill('Something else');
    await first.getByTestId('todo-edit-input').press('Escape');

    await expect(first.getByTestId('todo-title')).toHaveText(SEEDED[0]);
  });

  test('ignores an edit that is cleared to empty', async ({ page }) => {
    await page.goto('/');

    const first = items(page).first();
    await first.getByTestId('todo-edit').click();
    await first.getByTestId('todo-edit-input').fill('   ');
    await first.getByTestId('todo-edit-input').press('Enter');

    await expect(first.getByTestId('todo-title')).toHaveText(SEEDED[0]);
  });

  test('filters between all, active and done todos', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('filter-active').click();
    await expect(page.getByTestId('filter-active')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => itemTitles(page)).toEqual([SEEDED[0], SEEDED[1]]);

    await page.getByTestId('filter-done').click();
    await expect(page.getByTestId('filter-done')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => itemTitles(page)).toEqual([SEEDED[2]]);

    await page.getByTestId('filter-all').click();
    await expect(page.getByTestId('filter-all')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => itemTitles(page)).toEqual(SEEDED);
  });

  test('shows an empty message when a filter has no matches', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('filter-active').click();
    // Completing an item removes it from this filter, so click rather than check.
    await items(page).first().getByTestId('todo-toggle').click();
    await items(page).first().getByTestId('todo-toggle').click();
    await expect(page.getByTestId('empty-state')).toHaveText('No active tasks. Enjoy the calm!');

    await page.getByTestId('filter-all').click();
    await page.getByTestId('clear-completed').click();
    await page.getByTestId('filter-done').click();
    await expect(page.getByTestId('empty-state')).toHaveText('No completed tasks yet.');
  });

  test('uses singular wording when one item is left', async ({ page }) => {
    await page.goto('/');

    await items(page).nth(0).getByTestId('todo-toggle').check();
    await expect(page.getByTestId('todo-count')).toHaveText('1 item left');
  });

  test('clears completed todos', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('clear-completed')).toBeEnabled();
    await page.getByTestId('clear-completed').click();

    await expect(items(page)).toHaveCount(2);
    await expect.poll(() => itemTitles(page)).toEqual([SEEDED[0], SEEDED[1]]);
    await expect(page.getByTestId('clear-completed')).toBeDisabled();
  });

  test('persists todos in localStorage across reloads', async ({ page }) => {
    await page.goto('/');

    await addTodo(page, 'Renew library card');
    await items(page).first().getByTestId('todo-toggle').check();
    await items(page).nth(1).getByTestId('todo-edit').click();
    await items(page).nth(1).getByTestId('todo-edit-input').fill('Plan the autumn hike');
    await items(page).nth(1).getByTestId('todo-edit-input').press('Enter');
    await items(page).nth(2).getByTestId('todo-delete').click();

    await page.reload();

    await expect.poll(() => itemTitles(page)).toEqual([
      'Water the plants',
      'Plan the autumn hike',
      'Renew library card',
    ]);
    await expect(items(page).first()).toHaveAttribute('data-done', 'true');
    await expect(page.getByTestId('todo-count')).toHaveText('2 items left');
  });

  test('keeps an empty list after everything is deleted and reloaded', async ({ page }) => {
    await page.goto('/');

    for (let i = 0; i < 3; i++) {
      await items(page).first().getByTestId('todo-delete').click();
    }
    await expect(items(page)).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toHaveText(
      'Nothing here yet. Add your first task above.',
    );

    await page.reload();

    await expect(items(page)).toHaveCount(0);
    await expect(page.getByTestId('todo-count')).toHaveText('0 items left');
  });
});
