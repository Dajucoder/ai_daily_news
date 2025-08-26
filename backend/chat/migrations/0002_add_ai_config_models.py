# Generated manually for AI configuration models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('chat', '0001_initial'),
    ]

    operations = [
        # 创建AIProvider模型
        migrations.CreateModel(
            name='AIProvider',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='提供商名称')),
                ('provider_type', models.CharField(choices=[('openai', 'OpenAI'), ('siliconflow', 'SiliconFlow'), ('freegpt', 'FreeGPT'), ('qwen', '通义千问'), ('gemini', 'Gemini'), ('claude', 'Claude'), ('custom', '自定义')], max_length=20, verbose_name='提供商类型')),
                ('api_key', models.TextField(verbose_name='API密钥')),
                ('api_base_url', models.URLField(verbose_name='API基础地址')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否启用')),
                ('is_default', models.BooleanField(default=False, verbose_name='是否为默认配置')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_providers', to=settings.AUTH_USER_MODEL, verbose_name='用户')),
            ],
            options={
                'verbose_name': 'AI服务提供商',
                'verbose_name_plural': 'AI服务提供商',
                'ordering': ['-is_default', '-updated_at'],
            },
        ),
        
        # 创建AIModel模型
        migrations.CreateModel(
            name='AIModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('model_id', models.CharField(max_length=100, verbose_name='模型ID')),
                ('model_name', models.CharField(max_length=100, verbose_name='模型显示名称')),
                ('description', models.TextField(blank=True, null=True, verbose_name='模型描述')),
                ('max_tokens', models.IntegerField(default=4096, verbose_name='最大Token数')),
                ('support_functions', models.BooleanField(default=False, verbose_name='支持函数调用')),
                ('support_vision', models.BooleanField(default=False, verbose_name='支持图像理解')),
                ('input_price', models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True, verbose_name='输入价格(每1K tokens)')),
                ('output_price', models.DecimalField(blank=True, decimal_places=6, max_digits=10, null=True, verbose_name='输出价格(每1K tokens)')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否启用')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='models', to='chat.aiprovider', verbose_name='服务提供商')),
            ],
            options={
                'verbose_name': 'AI模型',
                'verbose_name_plural': 'AI模型',
                'ordering': ['model_name'],
            },
        ),
        
        # 为AIProvider添加唯一约束
        migrations.AlterUniqueTogether(
            name='aiprovider',
            unique_together={('user', 'name')},
        ),
        
        # 为AIModel添加唯一约束
        migrations.AlterUniqueTogether(
            name='aimodel',
            unique_together={('provider', 'model_id')},
        ),
        
        # 更新ChatSettings模型 - 移除model_name字段
        migrations.RemoveField(
            model_name='chatsettings',
            name='model_name',
        ),
        
        # 添加新的外键字段
        migrations.AddField(
            model_name='chatsettings',
            name='default_provider',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='chat.aiprovider', verbose_name='默认AI提供商'),
        ),
        migrations.AddField(
            model_name='chatsettings',
            name='default_model',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='chat.aimodel', verbose_name='默认AI模型'),
        ),
    ]
