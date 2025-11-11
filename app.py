from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='frontend/dist')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve built frontend files from frontend/dist when available.
    If no build exists, fall back to serving source files from frontend/ so the app
    can be run without a build (useful during development).
    """
    root = os.path.join(app.root_path, 'frontend')
    dist = os.path.join(root, 'dist')

    # If dist exists and the requested file exists there, serve it.
    if os.path.exists(dist):
        target = os.path.join(dist, path)
        if path != '' and os.path.exists(target):
            return send_from_directory(dist, path)
        # otherwise serve index.html from dist
        return send_from_directory(dist, 'index.html')

    # No dist -> serve directly from frontend source (index.html and static files)
    target = os.path.join(root, path)
    if path != '' and os.path.exists(target):
        return send_from_directory(root, path)

    # Fallback to index.html in source
    return send_from_directory(root, 'index.html')


if __name__ == '__main__':
    # Use 0.0.0.0 so it's reachable from other machines if deployed in a container
    app.run(host='0.0.0.0', port=5000, debug=True)
