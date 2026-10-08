import os

OUTPUT_FILE = "all_project_code.txt"

# Список папок, которые нужно полностью игнорировать (мусор и тяжелые зависимости)
EXCLUDE_DIRS = {
    "venv", ".venv", "node_modules", "__pycache__", 
    ".git", ".idea", ".vscode", "dist", "build", "alembic"
}

# Список расширений файлов, которые мы собираем для текстового анализа
ALLOWED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".json", ".sql", ".html", ".css", ".md", "Dockerfile"
}

# Список конкретных файлов, которые нельзя читать (безопасность и служебные скрипты)
EXCLUDE_FILES = {
    ".env", ".env.example", ".gitignore", "package-lock.json", 
    "all_code.txt", OUTPUT_FILE, "dump_project.py", "dump_code.py"
}

def collect_all_project_code():
    print("Начало сборки кодовой базы проекта EcoCity...")
    total_files = 0
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        # Обходим корень проекта рекурсивно
        for root, dirs, files in os.walk("."):
            
            # Фильтруем папки на исключение (модифицируем dirs на месте для os.walk)
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                # Проверяем, находится ли файл в списке исключений
                if file in EXCLUDE_FILES:
                    continue
                
                # Проверяем расширение файла или точное совпадение имени (например, Dockerfile)
                _, ext = os.path.splitext(file)
                if ext in ALLOWED_EXTENSIONS or file == "Dockerfile":
                    full_path = os.path.join(root, file)
                    normalized_path = os.path.normpath(full_path)
                    
                    try:
                        print(f"Добавление: {normalized_path}")
                        out.write(f"=== START_FILE: {normalized_path} ===\n")
                        with open(full_path, "r", encoding="utf-8") as f:
                            out.write(f.read())
                        out.write(f"\n=== END_FILE: {normalized_path} ===\n\n" + "="*80 + "\n\n")
                        total_files += 1
                    except Exception as e:
                        print(f"Ошибка чтения файла {normalized_path}: {e}")
                        
    print(f"\nУспешно! Объединено файлов: {total_files}.")
    print(f"Финальный лог сохранен в: {os.path.abspath(OUTPUT_FILE)}")

if __name__ == "__main__":
    collect_all_project_code()
