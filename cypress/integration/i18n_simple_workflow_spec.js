import * as specUtils from './common/spec_utils';
import { login, newPost, populateEntry, publishEntry } from '../utils/steps';

const backend = 'proxy';
const mode = 'fs';

const entry = {
  title: 'first title',
  body: 'first body',
  description: 'first description',
  category: 'first category',
  tags: 'tag1',
};

const expectedEnContent = `---
template: post
date: 1970-01-01T00:00:00.000Z
title: first title
description: first description
category: first category
tags:
  - tag1
---
`;

const expectedDeContent = `---
template: post
date: 1970-01-01T00:00:00.000Z
title: de
---
`;

const expectedFrContent = `---
template: post
title: fr
date: 1970-01-01T00:00:00.000Z
---
`;

const contentSingleFile = `---
en:
  template: post
  date: 1970-01-01T00:00:00.000Z
  title: first title
  description: first description
  category: first category
  tags:
    - tag1
  body: first body
de:
  template: post
  date: 1970-01-01T00:00:00.000Z
  title: de
fr:
  template: post
  title: fr
  date: 1970-01-01T00:00:00.000Z
---
`;

const enterTranslation = str => {
  cy.get(`[id^="title-field"]`)
    .first()
    .clear({ force: true });
  cy.get(`[id^="title-field"]`)
    .first()
    .type(str, { force: true });
};

const createAndTranslateEntry = () => {
  newPost();
  // fill the main entry
  populateEntry(entry, () => undefined);

  // fill the translation
  cy.get('.Pane2').within(() => {
    enterTranslation('de');

    cy.contains('span', 'de').click();
    cy.contains('span', 'fr').click();

    enterTranslation('fr');
  });

  // publish the entry
  publishEntry();
};

describe(`Proxy Backend Simple Workflow - '${mode}' mode`, () => {
  const taskResult = { data: {} };

  before(() => {
    specUtils.before(
      taskResult,
      {
        mode,
        publish_mode: 'simple',
        locales: ['en', 'de', 'fr'],
        collections: [{ fields: [{}, { translatable: true }, {}, { duplicate: true }] }],
      },
      backend,
    );
    Cypress.config('taskTimeout', 15 * 1000);
    Cypress.config('defaultCommandTimeout', 5 * 1000);
  });

  after(() => {
    specUtils.after(taskResult, backend);
  });

  beforeEach(() => {
    specUtils.beforeEach(taskResult, backend);
  });

  afterEach(() => {
    specUtils.afterEach(taskResult, backend);
  });

  it('can create entry with translation in locale_folders mode', () => {
    cy.task('updateConfig', { collections: [{ i18n_structure: 'locale_folders' }] });

    login(taskResult.data.user);

    createAndTranslateEntry();

    cy.readFile(`${taskResult.data.tempDir}/content/posts/en/1970-01-01-first-title.md`).should(
      'contain',
      expectedEnContent,
    );

    cy.readFile(`${taskResult.data.tempDir}/content/posts/de/1970-01-01-first-title.md`).should(
      'eq',
      expectedDeContent,
    );

    cy.readFile(`${taskResult.data.tempDir}/content/posts/fr/1970-01-01-first-title.md`).should(
      'eq',
      expectedFrContent,
    );
  });

  it('can create entry with translation in single_file mode', () => {
    cy.task('updateConfig', { collections: [{ i18n_structure: 'locale_file_extensions' }] });

    login(taskResult.data.user);

    createAndTranslateEntry();

    cy.readFile(`${taskResult.data.tempDir}/content/posts/1970-01-01-first-title.en.md`).should(
      'contain',
      expectedEnContent,
    );

    cy.readFile(`${taskResult.data.tempDir}/content/posts/1970-01-01-first-title.de.md`).should(
      'eq',
      expectedDeContent,
    );

    cy.readFile(`${taskResult.data.tempDir}/content/posts/1970-01-01-first-title.fr.md`).should(
      'eq',
      expectedFrContent,
    );
  });

  it('can create entry with translation in locale_file_extensions mode', () => {
    cy.task('updateConfig', { collections: [{ i18n_structure: 'single_file' }] });

    login(taskResult.data.user);

    createAndTranslateEntry();

    cy.readFile(`${taskResult.data.tempDir}/content/posts/1970-01-01-first-title.md`).should(
      'eq',
      contentSingleFile,
    );
  });
});