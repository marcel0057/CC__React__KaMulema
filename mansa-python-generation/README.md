# MANSA Python / Django

Fichiers produits pour la partie Python de la vidéo :

- `views.py` : génère les données et construit le HTML des listes de pays.
- `mansa_py.html` : template Django avec la boucle `{% for item in data %}`.

Dans un projet Django, placer `mansa_py.html` dans `templates/includes/`, puis appeler la page avec l'argument d'URL correspondant, par exemple `/index/mansa_py`.
