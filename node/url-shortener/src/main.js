import AppwriteService from './appwrite.js';
import { generateShortCode, throwIfMissing } from './utils.js';

export default async ({ res, req, log, error }) => {
  throwIfMissing(process.env, [
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_COLLECTION_ID',
    'SHORT_BASE_URL',
  ]);

  const appwrite = new AppwriteService();

  if (
    req.method === 'POST' &&
    req.headers['content-type'] === 'application/json'
  ) {
    try {
      throwIfMissing(req.body, ['url']);
      new URL(req.body.url);
    } catch (err) {
      error(err.message);
      return res.send({ error: err.message }, 400);
    }

    const urlEntry = await appwrite.createURLEntry(
      req.body.url,
      generateShortCode()
    );
    if (!urlEntry) {
      error('Failed to create url entry.');
      return res.json({ error: 'Failed to create url entry' }, 500);
    }

    return res.json(
      {
        short: `${process.env.SHORT_BASE_URL}/${urlEntry.$id}`,
        url: urlEntry.url,
      },
      201
    );
  }

  const shortId = req.path.replace(/^\/|\/$/g, '');
  log(`Fetching document from with ID: ${shortId}`);

  const urlEntry = await appwrite.getURLEntry(shortId);
  if (!urlEntry) {
    return res.send(`Not found.`, 404);
  }

  return res.redirect(urlEntry.url, 302);
};
