"use strict";

// Simple fetch wrapper that automatically attaches access token and handles 401 with refresh
// Assumes authClient.refresh and tokenStorage are available

const tokenStorage = require("../storage/tokenStorage");
const authClient = require("./authClient");

async function parseJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (_e) {
    return {};
  }
}

function buildHeaders({ json = true, withAuth = true, extra = {} } = {}) {
  const h = { ...extra };
  if (json) h["Content-Type"] = "application/json";
  if (withAuth) {
    const at = tokenStorage.getAccessToken();
    if (at) h["Authorization"] = `Bearer ${at}`;
  }
  return h;
}

async function request(input, { method = "GET", json = true, auth = true, body, headers } = {}) {
  const doFetch = async () => fetch(input, {
    method,
    headers: buildHeaders({ json, withAuth: auth, extra: headers }),
    body: body && json ? JSON.stringify(body) : body,
  });

  let res = await doFetch();
  if (res.status === 401 && auth) {
    // Try to refresh token once
    try {
      await authClient.refresh({ rotate: true });
      res = await doFetch();
    } catch (_e) {
      // refresh failed; fallthrough
    }
  }
  const data = await parseJson(res);
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

module.exports = {
  request,
  buildHeaders,
};
