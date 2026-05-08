const DB_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "08001",
  "08006",
  "28P01",
  "42P01",
  "42703",
  "42704",
  "57P01",
  "57P02",
  "57P03",
]);

function isDbUnavailableError(error) {
  if (!error) return false;

  const code =
    typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (DB_ERROR_CODES.has(code)) {
    return true;
  }

  const message = String(error.message || error).toLowerCase();
  return (
    message.includes("database_url is not set") ||
    message.includes("could not translate host name") ||
    message.includes("getaddrinfo enotfound") ||
    message.includes("econnrefused") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    (message.includes("table") && message.includes("does not exist")) ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

module.exports = { isDbUnavailableError };
