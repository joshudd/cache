### Getting Started

prerequisites:
```bash
# install postgresql
brew install postgresql@14
brew services start postgresql@14

# create virtual environment
conda create -n cache python=3.12
conda activate cache
```

setup database:
```bash
# create database
createdb -U josh cache_db

# copy environment variables
cp .env.example .env
# update .env with your values
```

install dependencies:
```bash
pip install -r requirements.txt
```

run migrations:
```bash
python manage.py migrate
```

create admin user:
```bash
python manage.py createsuperuser
```

run the development server:
```bash
python manage.py runserver
```

visit admin interface at http://localhost:8000/admin
