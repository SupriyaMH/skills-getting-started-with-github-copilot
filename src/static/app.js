document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select so options don't duplicate when we re-render
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Add participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = "Participants";
        participantsDiv.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            li.dataset.email = participant;

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = participant;

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "participant-remove";
            btn.title = `Unregister ${participant}`;
            btn.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
            btn.innerHTML = "&times;";

            btn.addEventListener("click", async () => {
              btn.disabled = true;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await res.json();
                if (res.ok) {
                  // Remove from DOM
                  li.remove();
                  // Update local details list
                  const idx = details.participants.indexOf(participant);
                  if (idx !== -1) details.participants.splice(idx, 1);

                  // If no participants left, show empty message
                  if (ul.children.length === 0) {
                    const empty = document.createElement("p");
                    empty.className = "participants-empty";
                    empty.textContent = "No participants yet";
                    participantsDiv.replaceChild(empty, ul);
                  }

                  // Update availability
                  const availabilityEl = activityCard.querySelector(".availability");
                  const newSpots = details.max_participants - details.participants.length;
                  if (availabilityEl) {
                    availabilityEl.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;
                  }

                  messageDiv.textContent = result.message;
                  messageDiv.className = "success";
                } else {
                  messageDiv.textContent = result.detail || "Failed to unregister";
                  messageDiv.className = "error";
                  btn.disabled = false;
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                btn.disabled = false;
              }
              messageDiv.classList.remove("hidden");
              setTimeout(() => messageDiv.classList.add("hidden"), 5000);
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          participantsDiv.appendChild(ul);
        } else {
          const empty = document.createElement("p");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet";
          participantsDiv.appendChild(empty);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to show newly added participant and updated availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
