# Generated manually : aligne le verbose_name FRANKFURTER avec l'URL reelle (.app)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("rates", "0002_alter_rateshistory_unique_together_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="rateshistory",
            name="source",
            field=models.CharField(
                choices=[
                    ("exchangeratesapi.io", "exchangeratesapi.io"),
                    ("frankfurter", "frankfurter.app"),
                    ("static", "Static (fixed FCFA rate)"),
                ],
                max_length=30,
            ),
        ),
    ]
