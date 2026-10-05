// Contract fixtures for tests only. They are never imported by application code.
export const photo = "http://127.0.0.1:5500/assets/racing-hero.webp";
export const user = {
  userId: 16,
  fullName: "Ahmed Al Badi",
  email: "ahmed@example.test",
  preferredLanguage: "en",
  accountStatus: "ACTIVE",
  joinedAt: "2024-01-15T09:00:00Z",
  avatarUrl: null,
  roles: ["OWNER", "TRAINER", "ORGANIZER", "ADMIN"],
};
export const camels = [
  {
    camelId: 7,
    name: "Shaheen",
    gender: "MALE",
    birthDate: "2021-03-10T00:00:00.000Z",
    breed: "Omani",
    photoUrl: photo,
    sire: "Sahm",
    dam: "Lulu",
    category: "Racing camel",
    status: "ACTIVE",
  },
  {
    camelId: 12,
    name: "Barq",
    gender: "MALE",
    birthDate: "2022-01-15T00:00:00.000Z",
    breed: "Omani",
    photoUrl: photo,
    sire: "Sahm",
    dam: "Lulu",
    category: "Racing camel",
    status: "ACTIVE",
  },
];
export const races = [
  {
    raceId: 1,
    name: "Muscat Spring Race",
    startsAt: "2030-04-20T07:00:00Z",
    location: "Muscat",
    distanceKm: 8,
    status: "OPEN",
    resultsImageUrl: null,
    organizerId: 16,
    organizationId: null,
  },
  {
    raceId: 2,
    name: "Barka Heritage Race",
    startsAt: "2024-01-20T07:00:00Z",
    location: "Barka",
    distanceKm: 6,
    status: "COMPLETED",
    resultsImageUrl: photo,
    organizerId: 16,
    organizationId: null,
  },
];
export const agreements = [
  {
    agreementId: 5,
    ownerUserId: 16,
    trainerUserId: 32,
    camelId: 7,
    feeOmr: 500,
    prizeSharePct: 10,
    saleSharePct: 5,
    startsAt: "2020-01-01T00:00:00Z",
    endsAt: "2035-01-01T00:00:00Z",
    status: "ACTIVE",
  },
  {
    agreementId: 6,
    ownerUserId: 8,
    trainerUserId: 16,
    camelId: 12,
    feeOmr: 250,
    prizeSharePct: 10,
    saleSharePct: 5,
    startsAt: "2020-01-01T00:00:00Z",
    endsAt: "2035-01-01T00:00:00Z",
    status: "ACTIVE",
  },
];
const pageOf = (content) => ({
  content,
  page: 0,
  number: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
});
export async function mockApi(
  page,
  { account = structuredClone(user), failPath = null } = {},
) {
  const writes = [],
    unexpected = [];
  let csrf = "test-csrf-1";
  let version = 1;
  const listing = {
    listingId: 3,
    askingPriceOmr: 1200,
    description: "Omani racing camel with a recorded pedigree.",
    camelId: 7,
    userId: 16,
    status: "AVAILABLE",
    createdAt: "2026-09-01T09:00:00Z",
  };
  const offer = {
    offerId: 4,
    offeredPriceOmr: 1100,
    userId: 22,
    listingId: 3,
    status: "PENDING",
    createdAt: "2026-09-03T09:00:00Z",
  };
  const challenge = {
    challengeId: 9,
    title: "The Heritage Challenge",
    opensAt: "2020-01-01T00:00:00Z",
    closesAt: "2035-01-01T00:00:00Z",
    status: "OPEN",
    creatorId: 16,
    totalVotes: 100,
    camels: camels.map((c, i) => ({
      ...c,
      voteCount: i ? 38 : 62,
      votePercent: i ? 38 : 62,
    })),
  };
  await page.route("http://127.0.0.1:8080/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname,
      method = request.method();
    const send = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: status === 204 ? "" : JSON.stringify(data),
      });
    if (path === failPath) return send({ message: "Service unavailable" }, 503);
    if (path === "/api/auth/csrf")
      return send({ headerName: "X-CSRF-TOKEN", token: csrf });
    if (method !== "GET") {
      const body = request.postDataJSON();
      writes.push({
        path,
        method,
        body,
        csrf: request.headers()["x-csrf-token"],
      });
      if (request.headers()["x-csrf-token"] !== csrf)
        return send({ message: "CSRF missing" }, 403);
      if (path === "/api/auth/register")
        return send({ ...user, roles: ["VIEWER"] }, 201);
      if (path === "/api/auth/login") {
        account = structuredClone(user);
        csrf = `test-csrf-${++version}`;
        return send(account);
      }
      if (path === "/api/auth/logout") {
        account = null;
        csrf = `test-csrf-${++version}`;
        return send(null, 204);
      }
      if (path === "/api/auth/forgot-password")
        return send({
          message: "If an eligible account exists, a reset link will be sent.",
        });
      if (path === "/api/auth/reset-password")
        return send({ message: "Password changed. Sign in again." });
      if (path === "/api/users/me") {
        account = { ...account, ...body };
        return send(account);
      }
      if (path === "/camel/add") return send(7);
      if (path === "/camel/update") return send({ ...camels[0], ...body });
      if (path === "/marketplace/add") return send(3);
      if (path === "/marketplace/update") return send({ ...listing, ...body });
      if (path === "/marketplace/deleteById") {
        listing.status = "CANCELLED";
        return send(true);
      }
      if (path === "/offer/add") return send(4);
      if (path === "/offer/4/accept") {
        offer.status = "ACCEPTED";
        listing.status = "SOLD";
        return send(offer);
      }
      if (path === "/offer/4/decline") {
        offer.status = "DECLINED";
        return send(offer);
      }
      if (path === "/offer/deleteById") return send(true);
      if (path === "/api/agreements")
        return send(
          {
            ...agreements[0],
            ...body,
            agreementId: 15,
            status: "PENDING_APPROVAL",
          },
          201,
        );
      if (/^\/api\/agreements\/\d+\/(accept|reject|terminate)$/.test(path))
        return send(agreements[0]);
      if (path === "/api/training-logs")
        return send({ ...body, logId: 1 }, 201);
      if (path === "/api/races") return send({ ...body, raceId: 1 }, 201);
      if (path === "/api/races/1") return send({ ...races[0], ...body });
      if (path === "/api/race-entries")
        return send({ entryId: 10, ...body, entryStatus: "PENDING" }, 201);
      if (/^\/api\/race-entries\/\d+$/.test(path))
        return send(
          method === "DELETE" ? null : { entryId: 10, ...body },
          method === "DELETE" ? 204 : 200,
        );
      if (
        path === "/api/race-results" ||
        /^\/api\/race-results\/\d+$/.test(path)
      )
        return send(body, 201);
      if (path === "/api/race-cards/races/1/publish")
        return send({ cardId: 1 });
      if (/^\/api\/admin\/users\/\d+\/(roles|status)$/.test(path))
        return send({ ...user, ...body });
      if (["/trainer-profile/add", "/trainer-profile/update"].includes(path))
        return send({ ...body, userId: 16 });
      if (path === "/api/challenges/9/votes") {
        challenge.totalVotes++;
        return send({ voteId: 1, ...body }, 201);
      }
      if (path === "/api/ai/chat")
        return send({
          answer: "Owners can register an active camel in an open race.",
          language: "en",
          sources: [
            {
              id: "rules",
              label: "Race registration rules",
              path: "/api/ai/guide",
            },
          ],
        });
    }
    if (path === "/api/users/me")
      return account
        ? send(account)
        : send({ message: "Authentication is required." }, 401);
    if (path === "/api/races")
      return send(
        pageOf(
          races.filter(
            (r) =>
              !url.searchParams.get("status") ||
              r.status === url.searchParams.get("status"),
          ),
        ),
      );
    if (/^\/api\/races\/\d+$/.test(path))
      return send(
        races.find((r) => r.raceId === Number(path.split("/").at(-1))) ||
          races[0],
      );
    if (path === "/camel/getAll") return send(pageOf(camels));
    if (path === "/camel/my-camels") return send(camels);
    if (path === "/camel/getById")
      return send(
        camels.find((c) => c.camelId === Number(url.searchParams.get("id"))) ||
          camels[0],
      );
    if (path === "/camel/profile")
      return send({
        ...camels[0],
        pedigree: {
          sire: "Sahm",
          dam: "Lulu",
          sireCamelId: null,
          damCamelId: null,
        },
        owners: [{ name: "Ahmed Al Badi", sharePercent: 100 }],
        activeListing: listing,
      });
    if (path === "/camel/ownership-history")
      return send([
        {
          ownershipId: 1,
          ownerName: "Ahmed Al Badi",
          sharePercent: 100,
          startAt: "2024-01-01T00:00:00Z",
          endAt: null,
          current: true,
        },
        {
          ownershipId: 2,
          ownerName: "Salim Al Hashmi",
          sharePercent: 100,
          startAt: "2022-01-01T00:00:00Z",
          endAt: "2024-01-01T00:00:00Z",
          current: false,
        },
      ]);
    if (path === "/marketplace/getAll") return send(pageOf([listing]));
    if (["/marketplace/my-listings", "/marketplace/history"].includes(path))
      return send([listing]);
    if (path === "/marketplace/getById") return send(listing);
    if (path === "/offer/getById") return send(offer);
    if (["/offer/getAll", "/offer/listing/3"].includes(path))
      return send([offer]);
    if (path === "/trainer-profile/getAll")
      return send([
        {
          userId: 32,
          bio: "Omani camel training with care and consistency.",
          location: "Muscat",
        },
        {
          userId: 16,
          bio: "Specialist in racing preparation.",
          location: "Barka",
        },
      ]);
    if (path === "/trainer-profile/getById")
      return send({
        userId: 16,
        bio: "Racing preparation.",
        location: "Barka",
      });
    if (path === "/api/agreements/mine") return send(agreements);
    if (/^\/api\/training-logs\/agreement\/\d+$/.test(path))
      return send([
        {
          logId: 1,
          agreementId: 6,
          camelId: 12,
          sessionAt: "2026-09-20T05:00:00Z",
          durationMinutes: 45,
          notes: "Strong pace and steady recovery.",
        },
      ]);
    if (path === "/api/race-cards/races/1/latest")
      return send({
        cardId: 1,
        raceId: 1,
        version: 1,
        publishDate: "2026-09-01T00:00:00Z",
        entries: [
          {
            participantNumber: 1,
            camelId: 7,
            camelName: "Shaheen",
            ownerName: "Ahmed Al Badi",
            trainerName: "Salim Al Rashdi",
          },
        ],
      });
    if (
      path === "/api/race-entries/mine" ||
      path === "/api/race-entries/race/1"
    )
      return send([
        {
          entryId: 10,
          participantNumber: 1,
          raceId: 1,
          camelId: 7,
          registrantId: 16,
          entryStatus: "PENDING",
        },
        {
          entryId: 11,
          participantNumber: 2,
          raceId: 1,
          camelId: 12,
          registrantId: 16,
          entryStatus: "ACCEPTED",
        },
      ]);
    if (path === "/api/race-results")
      return send([{ entryId: 11, finishPosition: 1, elapsedMs: 492340 }]);
    if (path === "/api/admin/users")
      return send(
        pageOf([
          user,
          {
            ...user,
            userId: 32,
            fullName: "Salim Al Rashdi",
            email: "salim@example.test",
            roles: ["TRAINER"],
          },
        ]),
      );
    if (path === "/api/challenges") return send(pageOf([challenge]));
    if (path === "/api/challenges/9") return send(challenge);
    if (path === "/api/ai/status")
      return send({
        available: true,
        languages: ["ar", "en"],
        maxQuestionLength: 2000,
      });
    unexpected.push({ method, path });
    return send({ message: `Unmocked API route: ${method} ${path}` }, 501);
  });
  return { writes, unexpected, setAccount: (value) => (account = value) };
}
