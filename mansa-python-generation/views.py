from django.shortcuts import render


def index(request, inc=None):
    def generate_select(country):
        """
        Sample function to generate a select box.

        Example usage
        data = {
            "Name": "Dieudonne KOUASSI", "Age": 25,
            "Profession": "content manager", "Country": "Togo"
        }
        country = data["Country"]
        select_element = generate_select(country)
        """
        countries = [
            "Algeria", "Benin", "Burundi", "Cameroun", "Guinea (Conakry)",
            "Ivory Coast", "RDC", "Togo", "Senegal"
        ]

        select_html = "<select>"
        for c in countries:
            selected = " selected" if c == country else ""
            select_html += f'<option{selected}>{c}</option>'
        select_html += "</select>"

        return select_html

    data = [
        {
            "Name": "Dieudonne KOUASSI",
            "Age": 25,
            "Profession": "Content Manager",
            "Country": "Togo",
        },
        {
            "Name": "Miravi BOKONZI",
            "Age": 26,
            "Profession": "Developper",
            "Country": "RDC",
        },
        {
            "Name": "Emani EFARA",
            "Age": 24,
            "Profession": "Content Manager",
            "Country": "Burundi",
        },
        {
            "Name": "Adonie ELAME",
            "Age": 31,
            "Profession": "Developper",
            "Country": "Cameroun",
        },
        {
            "Name": "Medou MIMBOTE",
            "Age": 28,
            "Profession": "Webmaster",
            "Country": "Ivory Coast",
        },
        {
            "Name": "Aissa ANDJARI",
            "Age": 27,
            "Profession": "Community Manager",
            "Country": "Algeria",
        },
        {
            "Name": "Wefa SIMANI",
            "Age": 33,
            "Profession": "Content Manager",
            "Country": "Senegal",
        },
        {
            "Name": "Oumani AWARU",
            "Age": 29,
            "Profession": "Content Manager",
            "Country": "Guinea (Conakry)",
        },
        {
            "Name": "Vodon AKPEMI",
            "Age": 23,
            "Profession": "Community Manager",
            "Country": "Benin",
        },
    ]

    for i in range(len(data)):
        data[i]["CountryHTML"] = generate_select(data[i]["Country"])

    return render(request, "index.html", {
        "data": data,
        "inc": f"includes/{inc}.html" if inc else None,
    })
