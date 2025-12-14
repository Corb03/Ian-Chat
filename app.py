from flask import Flask, render_template, request, redirect
from bs4 import BeautifulSoup
import os

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
ARCHIVES_FOLDER = "archives"

HTML_FILENAME = None  # keeps your upload flow working


def parse_discord_html(file_path: str):
    """Parse a raw Discord HTML export into the message dicts your viewer expects."""
    with open(file_path, encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    messages = []
    for msg in soup.select(".chatlog__message-container"):
        username = msg.select_one(".chatlog__author")
        timestamp = msg.select_one(".chatlog__timestamp a")
        content = msg.select_one(".chatlog__content")
        avatar = msg.select_one(".chatlog__avatar")

        messages.append({
            "username": username.text.strip() if username else "Unknown",
            "timestamp": timestamp.text.strip() if timestamp else "",
            "content": content.decode_contents() if content else "",
            "avatar": avatar["src"] if avatar and avatar.has_attr("src") else ""
        })

    return messages


@app.route("/")
def home():
    # Build dropdown list from /archives
    os.makedirs(ARCHIVES_FOLDER, exist_ok=True)
    archive_files = sorted([
        f for f in os.listdir(ARCHIVES_FOLDER)
        if f.lower().endswith(".html")
    ])

    selected_archive = request.args.get("archive", "").strip()
    messages = []
    html_filename = "No Channel Selected"

    # Priority 1: dropdown selection (/?archive=...)
    if selected_archive:
        if selected_archive in archive_files:
            html_filename = selected_archive
            file_path = os.path.join(ARCHIVES_FOLDER, selected_archive)
            messages = parse_discord_html(file_path)
        else:
            html_filename = "Invalid archive selection"

    # Priority 2: uploaded file selection (your old behavior)
    elif HTML_FILENAME:
        file_path = os.path.join(UPLOAD_FOLDER, HTML_FILENAME)
        if os.path.exists(file_path):
            html_filename = HTML_FILENAME
            messages = parse_discord_html(file_path)
        else:
            html_filename = "File not found"

    return render_template(
        "viewer.html",
        messages=messages,
        html_filename=html_filename,
        archive_files=archive_files,
        selected_archive=selected_archive
    )


@app.route("/switch", methods=["POST"])
def switch():
    """Optional fallback: upload an HTML export to /uploads and show it."""
    global HTML_FILENAME

    if "html_file" not in request.files:
        return "No file uploaded", 400

    file = request.files["html_file"]
    if file.filename == "":
        return "No selected file", 400

    if not file.filename.lower().endswith(".html"):
        return "Only .html files allowed", 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    HTML_FILENAME = file.filename
    return redirect("/")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
