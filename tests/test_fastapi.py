from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_root_redirects_to_static_index():
    r = client.get("/", follow_redirects=False)
    assert r.status_code in (301, 302, 307)
    assert r.headers.get("location") == "/static/index.html"


def test_static_index_served():
    r = client.get("/static/index.html")
    assert r.status_code == 200
    assert "Mergington High School" in r.text


def test_signup_and_unregistration_flow():
    email = "fastapi_test@example.com"
    activity = "Art Club"

    # sign up
    r = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200

    # verify presence
    r = client.get("/activities")
    assert email in r.json()[activity]["participants"]

    # unregister
    r = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert r.status_code == 200

    # ensure it's gone
    r = client.get("/activities")
    assert email not in r.json()[activity]["participants"]
