class ApiFeatures{
    constructor(query, queryStr){
        this.query = query;              // Task.find
        this.queryStr = queryStr;        // req.query
    }

    filter(){
        const query = {...this.queryStr};

        const removeFields = ["sort", "page", "limit", "sugg"];

        removeFields.forEach((ele)=>{
            delete query[ele];
        })

        let winningPlan = {};

        if(this.queryStr.city && this.queryStr.category){
            winningPlan = {city : 1, category : 1, score : -1}
        }
        else if(this.queryStr.city && !this.queryStr.category){
            winningPlan = {city : 1, score :-1}
        }

        let categoryValue;

        if(query.category)
        {
            categoryValue = query.category.split(',') || [];
            query.category = { $in : categoryValue }
        }

        if(query.city && typeof(query.city) == "string"){
            console.log(query.city);
            query.city = query.city.toLocaleLowerCase();
        }


        console.log(query);

        this.query = this.query.find(query).hint(winningPlan);

        return this;
    }

    sort(){
        if(this.queryStr.sort){
                const sortBy = this.queryStr.sort.replaceAll(',',' ');
                this.query = this.query.sort(sortBy);
            }
            return this;
    }

    paginate(){
        if(this.queryStr.limit && this.queryStr.page){
            const page = this.queryStr.page*1 || 1;
            const limit = this.queryStr.limit*1 || 10;
            const skip = (page -1)*limit;

            this.query = this.query.skip(skip).limit(limit);

        }
        return this;
    }
}

module.exports = ApiFeatures;