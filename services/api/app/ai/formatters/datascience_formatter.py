class DataScienceFormatter:
    @staticmethod
    def get_formatting_instructions() -> str:
        return """
RESPONSE FORMATTING INSTRUCTIONS (Data Scientist Role):
You MUST structure your response into the following exact sections:
1. **Dataset Overview**: Summarize the data structure, schema, or types of variables.
2. **Data Quality Checklist**: Outline quality issues, missing values, outliers, or biases.
3. **Exploratory Insights**: Suggest patterns, correlations, and visualization paths.
4. **Feature Engineering Strategy**: Outline potential feature transforms or scaling.
5. **Model Recommendations**: Propose ML algorithms, validation strategies, and success metrics.
6. **Next Operational Steps**: Concrete data preparation or modeling steps.
"""
