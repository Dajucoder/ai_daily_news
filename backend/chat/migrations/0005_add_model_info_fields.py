# Generated manually for adding model info fields to Message model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0004_add_thinking_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='model_name',
            field=models.CharField(blank=True, max_length=200, null=True, verbose_name='使用的模型名称'),
        ),
        migrations.AddField(
            model_name='message',
            name='model_provider',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='模型提供商'),
        ),
    ]
