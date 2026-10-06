import { api } from "./api.js";

export const raceApi = {
    getRaces(search = "", status = "", page = 0, size = 10) {
        const params = new URLSearchParams();

        if (search.trim()) {
            params.set("search", search.trim());
        }

        if (status) {
            params.set("status", status);
        }

        params.set("page", page);
        params.set("size", size);

        return api(`/api/races?${params.toString()}`);
    },

    getRaceById(id) {
        return api(`/api/races/${id}`);
    },

    createRace(payload) {
        return api("/api/races", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    updateRace(id, payload) {
        return api(`/api/races/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },

    deleteRace(id) {
        return api(`/api/races/${id}`, {
            method: "DELETE"
        });
    }
};

export const raceEntryApi = {
    create(payload) {
        return api("/api/race-entries", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    getAll() {
        return api("/api/race-entries");
    },

    getMine() {
        return api("/api/race-entries/mine");
    },

    getForRace(raceId) {
        return api(`/api/race-entries/race/${raceId}`);
    },

    getById(id) {
        return api(`/api/race-entries/${id}`);
    },

    updateStatus(id, payload) {
        return api(`/api/race-entries/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },

    withdraw(id) {
        return api(`/api/race-entries/${id}`, {
            method: "DELETE"
        });
    }
};

export const raceResultApi = {
    getAll() {
        return api("/api/race-results");
    },

    getByEntryId(entryId) {
        return api(`/api/race-results/${entryId}`);
    },

    create(payload) {
        return api("/api/race-results", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    update(entryId, payload) {
        return api(`/api/race-results/${entryId}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
    },

    delete(entryId) {
        return api(`/api/race-results/${entryId}`, {
            method: "DELETE"
        });
    }
};