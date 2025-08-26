# Generated manually for adding thinking field to Message model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_create_default_ai_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='thinking',
            field=models.TextField(blank=True, null=True, verbose_name='思考过程'),
        ),
    ]
