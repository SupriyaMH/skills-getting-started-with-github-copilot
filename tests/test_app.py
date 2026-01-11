from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module
from src.app import app

client = TestClient(app)

# Snapshot initial state to restore between tests
_initial_activities = deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    # reset before each test
    app_module.activities.clear()
    app_module.activities.update(deepcopy(_initial_activities))
    yield
    # ensure state is restored after test as well
    app_module.activities.clear()
    app_module.activities.update(deepcopy(_initial_activities))


def test_get_activities():
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_and_presence():
    email = "testuser@example.com"
    activity = "Basketball"
    r = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200
    data = client.get("/activities").json()
    assert email in data[activity]["participants"]


def test_signup_duplicate_raises():
    email = "duplicate@example.com"
    activity = "Basketball"
    r = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200
    r2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r2.status_code == 400


def test_unregister_success_and_failure():
    email = "remove_me@example.com"
    activity = "Tennis Club"
    r = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200

    r = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200

    r2 = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert r2.status_code == 400


def test_nonexistent_activity_returns_404():
    email = "x@example.com"
    r = client.post("/activities/NoSuchActivity/signup", params={"email": email})
    assert r.status_code == 404
    r = client.delete("/activities/NoSuchActivity/signup", params={"email": email})
    assert r.status_code == 404
